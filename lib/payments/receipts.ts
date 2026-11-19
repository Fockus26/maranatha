import "server-only";
import { AwsClient } from "aws4fetch";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { paymentReceipts } from "@/lib/db/schema";

/**
 * Comprobantes de pago subidos por los donantes (D094).
 *
 * - **Cloudflare R2** (bucket privado, API S3) cuando están las `R2_*`: así
 *   corre producción y los previews, cada uno con su bucket.
 * - **La tabla `payment_receipts`** (D082) cuando no: QA local y desarrollo sin
 *   claves de R2. Lectura: si R2 no tiene el archivo se busca en la tabla, para
 *   los subidos antes del cambio que aún no se movieron
 *   (`scripts/receipts-to-r2.ts`).
 *
 * El tipo se valida por los primeros bytes del archivo, no por el
 * `Content-Type` ni la extensión que manda el navegador (ambos los controla
 * el cliente), y se vuelve a validar al leerlo. Límite de 4 MB: las funciones
 * de Vercel cortan el body de la petición en ~4.5 MB, y el multipart agrega
 * algo de overhead.
 *
 * Solo un admin los ve, por `app/dashboard/comprobantes/[id]/route.ts`: el
 * bucket nunca es público ni se firma una URL para el navegador.
 */

export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

type ReceiptKind = { ext: string; mime: string };

export function sniffReceipt(bytes: Uint8Array): ReceiptKind | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return { ext: "jpg", mime: "image/jpeg" };
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { ext: "png", mime: "image/png" };
  if (starts(0x25, 0x50, 0x44, 0x46))
    return { ext: "pdf", mime: "application/pdf" };
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
    return { ext: "webp", mime: "image/webp" };
  return null;
}

// ─── R2 ─────────────────────────────────────────────────────────────────

type Bucket = { client: AwsClient; base: string };

/** El bucket de este entorno, o `null` si faltan las `R2_*`. */
export function receiptBucket(): Bucket | null {
  const account = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!account || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    // Pocos reintentos: un donante esperando no aguanta los 25 s por defecto.
    client: new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
      retries: 2,
    }),
    base: `https://${account}.r2.cloudflarestorage.com/${bucket}`,
  };
}

/** `2026-11/<uuid>.png`: solo caracteres seguros en una URL, sin codificar. */
const SAFE_PATH = /^\d{4}-\d{2}\/[0-9a-f-]{36}\.(jpg|png|pdf|webp)$/;

/** Bucket y URL del objeto, o `null` sin R2 o con un path de otra forma (la tabla). */
function inBucket(path: string): { bucket: Bucket; url: string } | null {
  const bucket = receiptBucket();
  if (!bucket || !SAFE_PATH.test(path)) return null;
  return { bucket, url: `${bucket.base}/${path}` };
}

// ─── API ────────────────────────────────────────────────────────────────

export type ReceiptUploadError = "invalid_receipt" | "upload_failed";

export async function uploadReceipt(
  file: File,
): Promise<
  { ok: true; path: string } | { ok: false; error: ReceiptUploadError }
> {
  if (file.size === 0 || file.size > MAX_RECEIPT_BYTES)
    return { ok: false, error: "invalid_receipt" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffReceipt(bytes);
  if (!kind) return { ok: false, error: "invalid_receipt" };

  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${crypto.randomUUID()}.${kind.ext}`;

  const target = inBucket(path);
  if (target) {
    try {
      const res = await target.bucket.client.fetch(target.url, {
        method: "PUT",
        headers: { "Content-Type": kind.mime },
        body: bytes,
      });
      if (!res.ok) {
        console.error("[payments] uploadReceipt R2:", res.status);
        return { ok: false, error: "upload_failed" };
      }
      return { ok: true, path };
    } catch (error) {
      console.error("[payments] uploadReceipt R2:", error);
      return { ok: false, error: "upload_failed" };
    }
  }

  if (!isDbConfigured()) return { ok: false, error: "upload_failed" };
  try {
    await db()
      .insert(paymentReceipts)
      .values({
        path,
        mime: kind.mime,
        size: bytes.byteLength,
        bytes: Buffer.from(bytes),
      });
  } catch (error) {
    console.error("[payments] uploadReceipt:", error);
    return { ok: false, error: "upload_failed" };
  }
  return { ok: true, path };
}

export async function deleteReceipt(path: string): Promise<void> {
  const target = inBucket(path);
  if (target) {
    try {
      const res = await target.bucket.client.fetch(target.url, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 404)
        console.error("[payments] deleteReceipt R2:", res.status);
    } catch (error) {
      console.error("[payments] deleteReceipt R2:", error);
    }
  }
  if (!isDbConfigured()) return;
  try {
    await db().delete(paymentReceipts).where(eq(paymentReceipts.path, path));
  } catch (error) {
    console.error("[payments] deleteReceipt:", error);
  }
}

export async function getReceipt(
  path: string,
): Promise<{ mime: string; bytes: Buffer } | null> {
  const target = inBucket(path);
  if (target) {
    try {
      const res = await target.bucket.client.fetch(target.url);
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        // Se confía en los bytes, no en el Content-Type guardado.
        const kind = sniffReceipt(bytes);
        return kind ? { mime: kind.mime, bytes } : null;
      }
      if (res.status !== 404) {
        console.error("[payments] getReceipt R2:", res.status);
        return null;
      }
      // 404: puede ser uno anterior al cambio, todavía en la tabla.
    } catch (error) {
      console.error("[payments] getReceipt R2:", error);
      return null;
    }
  }
  if (!isDbConfigured()) return null;
  try {
    const [row] = await db()
      .select({ mime: paymentReceipts.mime, bytes: paymentReceipts.bytes })
      .from(paymentReceipts)
      .where(eq(paymentReceipts.path, path))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error("[payments] getReceipt:", error);
    return null;
  }
}

/** Ruta del panel que sirve el comprobante de un pago (solo admins). */
export function receiptHref(paymentId: string): string {
  return `/dashboard/comprobantes/${paymentId}`;
}
