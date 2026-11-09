import { Button, Heading, Link, Text } from "@react-email/components";
import { radius, spacing, typography } from "@/theme/tokens";
import { EmailLayout, emailColors } from "./EmailLayout";

export const RESET_PASSWORD_SUBJECT = "Restablece tu contraseña del panel";

/** Enlace de Better Auth para elegir una contraseña nueva (vence en 1 hora). */
export function ResetPasswordEmail({ url }: { url: string }) {
  return (
    <EmailLayout
      title={RESET_PASSWORD_SUBJECT}
      preview="Usa este enlace en la próxima hora para elegir una contraseña nueva."
    >
      <Heading
        as="h1"
        style={{
          margin: `0 0 ${spacing.base}px`,
          fontSize: typography.size.h4.desktop,
          lineHeight: typography.lineHeight.h4,
          color: emailColors.text,
        }}
      >
        Restablece tu contraseña
      </Heading>
      <Text
        style={{
          fontSize: typography.size.body,
          lineHeight: typography.lineHeight.body,
          color: emailColors.text,
        }}
      >
        Alguien pidió cambiar la contraseña de tu cuenta del panel. Si fuiste
        tú, elige una nueva con este botón. El enlace vence en una hora y solo
        se puede usar una vez.
      </Text>
      <Button
        href={url}
        style={{
          display: "inline-block",
          backgroundColor: emailColors.action,
          color: emailColors.onAction,
          borderRadius: radius.md,
          padding: `${spacing.md}px ${spacing.lg}px`,
          fontSize: typography.size.body,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Elegir contraseña nueva
      </Button>
      <Text
        style={{
          fontSize: typography.size.small,
          lineHeight: typography.lineHeight.small,
          color: emailColors.muted,
        }}
      >
        Si el botón no funciona, copia esta dirección en el navegador:{" "}
        <Link
          href={url}
          style={{ color: emailColors.action, wordBreak: "break-all" }}
        >
          {url}
        </Link>
      </Text>
      <Text
        style={{
          fontSize: typography.size.small,
          lineHeight: typography.lineHeight.small,
          color: emailColors.muted,
        }}
      >
        Si no pediste el cambio, ignora este correo: tu contraseña sigue igual.
      </Text>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  url: "https://admin.iglesiamaranatha.example/api/auth/reset-password/AbC123xYz?callbackURL=%2Fdashboard%2Frestablecer",
};
