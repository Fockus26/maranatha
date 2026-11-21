import type { ReactNode } from "react";

interface TitheLayoutProps {
  /** Columna de texto (icono, eyebrow, título, párrafo, contador). */
  text: ReactNode;
  /** Columna del formulario / paso de pago. */
  form: ReactNode;
}

/**
 * Fila texto + formulario compartida por la sección Ofrendar del inicio y por
 * el modal, para que la separación no vuelva a divergir (D105). Ancho total
 * `max-w-narrow` (960, el del modal; token desde D109); columnas de 480 y 440.
 */
export function TitheLayout({ text, form }: TitheLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-narrow flex-col items-center justify-center gap-6 md:flex-row md:items-start md:gap-10">
      <div className="max-w-120 text-center md:pt-2 md:text-left">{text}</div>
      <div className="w-full max-w-110 shrink-0">{form}</div>
    </div>
  );
}
