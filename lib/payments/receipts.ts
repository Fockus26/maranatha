import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Comprobantes de pago subidos por los donantes (bucket privado `receipts`).
 *
 * El tipo se valida por los primeros bytes del archivo, no por el
 * `Content-Type` ni la extensión que manda el navegador (ambos los controla
 * el cliente). Límite de 4 MB: las funciones de Vercel cortan el body de la
 * petición en ~4.5 MB, y el multipart agrega algo de overhead.
 */

export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
const BUCKET = "receipts";

type ReceiptKind = { ext: string; mime: string };

function sniff(bytes: Uint8Array): ReceiptKind | null {
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
  const kind = sniff(bytes);
  if (!kind) return { ok: false, error: "invalid_receipt" };

  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, bytes, {
      contentType: kind.mime,
      upsert: false,
    });
  if (error) {
    console.error("[payments] uploadReceipt:", error);
    return { ok: false, error: "upload_failed" };
  }
  return { ok: true, path };
}

export async function deleteReceipt(path: string): Promise<void> {
  const { error } = await supabaseAdmin().storage.from(BUCKET).remove([path]);
  if (error) console.error("[payments] deleteReceipt:", error);
}

/** URL temporal (5 min) para que un admin vea el comprobante. */
export async function getReceiptUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(path, 300);
  if (error) {
    console.error("[payments] getReceiptUrl:", error);
    return null;
  }
  return data.signedUrl;
}
