import "server-only";
import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import type { ReactElement } from "react";

/**
 * El único lugar que habla con el SMTP (D082): Brevo en Vercel y en el VPS
 * (`smtp-relay.brevo.com:587`), Mailpit en QA (`qa:local` pone las `SMTP_*`).
 * Sin `SMTP_HOST` no se envía nada y se registra: el panel sigue funcionando,
 * solo sin recuperación de contraseña.
 */

let transport: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getTransport(): Transporter {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
  return transport;
}

export async function sendEmail(
  to: string,
  subject: string,
  element: ReactElement,
): Promise<void> {
  if (!isEmailConfigured()) {
    console.error("[email] sin SMTP_HOST/SMTP_FROM: no se envió", subject);
    return;
  }
  try {
    await getTransport().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: await render(element),
      text: await render(element, { plainText: true }),
    });
  } catch (error) {
    console.error("[email] sendEmail:", error);
  }
}
