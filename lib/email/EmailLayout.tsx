import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import {
  common,
  fontScale,
  gray,
  radius,
  secondary,
  spacing,
  typography,
} from "@/theme/tokens";

/** Ancho de lectura estándar de un correo (600 px menos el margen). */
const EMAIL_WIDTH = 560;

/**
 * Marco común de los correos de la app (kit `EMAIL-TEMPLATES.md`). Colores y
 * medidas de `theme/tokens.ts`; la fuente es la del sistema, porque las web
 * fonts no cargan en la mayoría de clientes de correo.
 */

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const emailColors = {
  text: gray[900],
  muted: gray[600], // 8.6:1 sobre blanco
  /** Botón: blanco sobre secondary[700], 5.4:1. */
  action: secondary[700],
  onAction: common.white,
  surface: common.white,
  page: gray[50],
  divider: gray[200],
} as const;

export function EmailLayout({
  title,
  preview,
  children,
}: {
  title: string;
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="es">
      <Head>
        <title>{title}</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: emailColors.page,
          fontFamily: FONT,
          margin: 0,
          padding: `${spacing.xl}px ${spacing.base}px`,
        }}
      >
        <Container
          style={{
            maxWidth: EMAIL_WIDTH,
            backgroundColor: emailColors.surface,
            borderRadius: radius.lg,
            padding: `${spacing.xl}px ${spacing.lg}px`,
          }}
        >
          <Text
            style={{
              margin: `0 0 ${spacing.lg}px`,
              fontSize: typography.size.small,
              fontWeight: 600,
              color: emailColors.text,
            }}
          >
            Iglesia Maranatha
          </Text>
          {children}
          <Section
            style={{
              borderTop: `1px solid ${emailColors.divider}`,
              marginTop: spacing.xl,
              paddingTop: spacing.base,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: fontScale[12],
                color: emailColors.muted,
              }}
            >
              Este correo lo envía el panel administrativo de la Iglesia
              Maranatha. Si no lo esperabas, puedes ignorarlo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
