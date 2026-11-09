import "server-only";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { paymentReceipts } from "@/lib/db/schema";

/**
 * Comprobantes de pago subidos por los donantes, en la tabla
 * `payment_receipts` (D082: antes, bucket privado de Supabase Storage). Así
 * entran en el respaldo nocturno de la base sin un bucket propio, y funcionan
 * igual en Vercel y en el VPS.
 *
 * El tipo se valida por los primeros bytes del archivo, no por el
 * `Content-Type` ni la extensión que manda el navegador (ambos los controla
 * el cliente). Límite de 4 MB: las funciones de Vercel cortan el body de la
 * petición en ~4.5 MB, y el multipart agrega algo de overhead.
 *
 * Solo un admin los ve, por `app/dashboard/comprobantes/[id]/route.ts`.
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
  if (!isDbConfigured()) return { ok: false, error: "upload_failed" };

  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${crypto.randomUUID()}.${kind.ext}`;
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
