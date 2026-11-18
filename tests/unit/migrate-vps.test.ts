import { describe, expect, mock, test } from "bun:test";
import bcrypt from "bcryptjs";
import { hashPassword } from "better-auth/crypto";

// Módulos server-only; en los tests no hay frontera cliente/servidor.
mock.module("server-only", () => ({}));
const { isBcryptHash, trustedOrigins, verifyAnyPassword } = await import(
  "@/lib/auth/server"
);
const { isAdminEmail } = await import("@/lib/auth/emails");
const { sniffReceipt } = await import("@/lib/payments/receipts");
const { toPaymentColumns, toPaymentRow } = await import(
  "@/lib/payments/repository"
);

describe("D082 · contraseñas importadas de Supabase", () => {
  test("reconoce los hash bcrypt de Supabase y no los de scrypt", async () => {
    expect(isBcryptHash(bcrypt.hashSync("x", 4))).toBe(true);
    expect(isBcryptHash("$2a$10$abcdefghijklmnopqrstuv")).toBe(true);
    expect(isBcryptHash(await hashPassword("una-clave-larga"))).toBe(false);
  });

  test("un admin importado entra con su contraseña de siempre (bcrypt)", async () => {
    const hash = bcrypt.hashSync("Contraseña-de-Supabase", 10);
    expect(
      await verifyAnyPassword({ hash, password: "Contraseña-de-Supabase" }),
    ).toBe(true);
    expect(await verifyAnyPassword({ hash, password: "otra" })).toBe(false);
  });

  test("una contraseña nueva (scrypt de Better Auth) también verifica", async () => {
    const hash = await hashPassword("Nueva-contraseña-2026");
    expect(
      await verifyAnyPassword({ hash, password: "Nueva-contraseña-2026" }),
    ).toBe(true);
    expect(
      await verifyAnyPassword({ hash, password: "Nueva-contraseña" }),
    ).toBe(false);
  });
});

describe("D082 · acceso al panel", () => {
  test("solo los correos de ADMIN_EMAILS, sin importar mayúsculas", () => {
    const saved = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = " Tesoreria@Ejemplo.com , pastor@ejemplo.com";
    expect(isAdminEmail("tesoreria@ejemplo.com")).toBe(true);
    expect(isAdminEmail("PASTOR@ejemplo.com")).toBe(true);
    expect(isAdminEmail("otro@ejemplo.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    process.env.ADMIN_EMAILS = saved;
  });

  test("acepta el login desde el panel, el sitio y el despliegue de Vercel", () => {
    expect(
      trustedOrigins({
        BETTER_AUTH_URL: "https://admin.maranatha.example/",
        NEXT_PUBLIC_SITE_URL: "https://maranatha.example",
        ADMIN_HOST: "admin.maranatha.example",
        VERCEL_URL: "maranatha-abc123.vercel.app",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual([
      "https://admin.maranatha.example",
      "https://maranatha.example",
      "https://admin.maranatha.example",
      "https://maranatha-abc123.vercel.app",
    ]);
    expect(trustedOrigins({} as unknown as NodeJS.ProcessEnv)).toEqual([]);
  });

  test("acepta el login desde el preview de kit-deploy", () => {
    expect(
      trustedOrigins({
        BETTER_AUTH_URL: "https://maranatha.fockus.dev",
        KIT_DEPLOY_PREVIEW_URL: "https://maranatha-pr-12.preview.fockus.dev",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual([
      "https://maranatha.fockus.dev",
      "https://maranatha-pr-12.preview.fockus.dev",
    ]);
  });
});

describe("D082 · comprobantes en la base", () => {
  test("el tipo sale de los bytes, no de la extensión", () => {
    expect(sniffReceipt(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe(
      "image/jpeg",
    );
    expect(
      sniffReceipt(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))?.mime,
    ).toBe("image/png");
    expect(sniffReceipt(new TextEncoder().encode("%PDF-1.7"))?.ext).toBe("pdf");
    expect(
      sniffReceipt(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))?.mime,
    ).toBe("image/webp");
    expect(sniffReceipt(new TextEncoder().encode("<svg onload=x>"))).toBeNull();
  });
});

describe("D082 · la fila de pago conserva su forma de siempre", () => {
  const now = new Date("2026-11-09T15:00:00.000Z");

  test("Drizzle → PaymentRow: montos number y fechas ISO", () => {
    const row = toPaymentRow({
      id: "11111111-1111-4111-8111-111111111111",
      createdAt: now,
      updatedAt: now,
      purpose: "proyecto",
      projectSlug: "techo-para-el-salon-multiusos",
      frequency: "once",
      amountUsd: "25.50",
      amountPaid: "9180.75",
      currency: "VES",
      exchangeRate: "360.0300",
      method: "pagomovil",
      status: "confirmed",
      donorName: "Donante",
      donorEmail: "d@example.test",
      reference: "0102-55",
      paidAt: "2026-11-06",
      receiptPath: "2026-11/a.png",
      referenceNorm: "010255",
      providerOrderId: null,
      providerCaptureId: null,
      providerSubscriptionId: null,
      confirmedAt: now,
      confirmedBy: "admin@example.test",
      notes: null,
    });
    expect(row.amount_usd).toBe(25.5);
    expect(row.amount_paid).toBe(9180.75);
    expect(row.exchange_rate).toBe(360.03);
    expect(row.created_at).toBe("2026-11-09T15:00:00.000Z");
    expect(row.confirmed_at).toBe("2026-11-09T15:00:00.000Z");
    expect(row.paid_at).toBe("2026-11-06");
    expect("reference_norm" in row).toBe(false);
  });

  test("un patch solo toca las columnas que trae, y null sí se escribe", () => {
    expect(
      toPaymentColumns({
        status: "confirmed",
        amount_paid: 12,
        confirmed_at: "2026-11-09T15:00:00.000Z",
        notes: null,
      }),
    ).toEqual({
      status: "confirmed",
      amountPaid: "12",
      confirmedAt: now,
      notes: null,
    });
  });
});
