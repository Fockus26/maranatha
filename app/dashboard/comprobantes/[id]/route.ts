import { z } from "zod";
import { getAdminStrict } from "@/lib/auth/admin";
import { getReceipt } from "@/lib/payments/receipts";
import { getPayment } from "@/lib/payments/repository";

/**
 * Comprobante de un pago, solo para admins (D082). Reemplaza a la URL firmada
 * de Supabase Storage: el archivo sale de `payment_receipts` tras verificar
 * la sesión en la base. Sin admin, o con un id que no tiene comprobante, la
 * respuesta es la misma 404: no se revela qué pagos existen.
 */

const NOT_FOUND = () =>
  new Response("No encontrado", {
    status: 404,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function GET(
  _req: Request,
  ctx: RouteContext<"/dashboard/comprobantes/[id]">,
): Promise<Response> {
  const admin = await getAdminStrict();
  if (!admin) return NOT_FOUND();

  const { id } = await ctx.params;
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return NOT_FOUND();

  const payment = await getPayment(parsed.data);
  if (!payment.ok || !payment.data.receipt_path) return NOT_FOUND();

  const receipt = await getReceipt(payment.data.receipt_path);
  if (!receipt) return NOT_FOUND();

  const ext = payment.data.receipt_path.split(".").pop() ?? "bin";
  const headers = new Headers({
    "Content-Type": receipt.mime,
    "Content-Disposition": `inline; filename="comprobante-${parsed.data.slice(0, 8)}.${ext}"`,
    "Cache-Control": "private, no-store",
    // El tipo ya se validó por sus bytes al subirlo; esto evita que el
    // navegador "adivine" otro.
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  });
  // Las imágenes, además, aisladas del resto del panel. Al PDF no se le pone
  // `sandbox`: Chrome bloquea su visor dentro de un documento aislado.
  if (receipt.mime.startsWith("image/"))
    headers.set(
      "Content-Security-Policy",
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    );
  return new Response(new Uint8Array(receipt.bytes), { headers });
}
