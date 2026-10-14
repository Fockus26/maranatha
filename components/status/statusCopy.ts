/**
 * Copy de las pantallas de estado (D079, adenda de diseño). Voz de la
 * iglesia, es-VE, sin juegos de palabras. Provisional hasta que César lo
 * confirme (CONTENT_CHECKLIST).
 */
export type StatusVariant =
  | "404"
  | "404-admin"
  | "500"
  | "offline"
  | "maintenance";

export interface StatusAction {
  label: string;
  /** Sin `href` es el botón "Reintentar". */
  href?: string;
  primary?: boolean;
}

export interface StatusCopy {
  label: string;
  title: string;
  /** Título del documento (`<title>`). */
  docTitle: string;
  line: string;
  actions: StatusAction[];
  icon: "compass" | "alert" | "offline" | "tools";
}

const RETRY: StatusAction = { label: "Reintentar", primary: true };
const HOME: StatusAction = { label: "Ir al inicio", href: "/" };

export function getStatusCopy(
  variant: StatusVariant,
  opts: { hasCode?: boolean; hasReturnAt?: boolean; panelHref?: string } = {},
): StatusCopy {
  switch (variant) {
    case "404":
      return {
        label: "Error 404",
        title: "No encontramos esta página",
        docTitle: "Página no encontrada",
        line: "Puede que el enlace haya cambiado o que la dirección tenga un error. Te ayudamos a encontrar el camino.",
        actions: [
          { ...HOME, primary: true },
          { label: "Ver reuniones", href: "/#agenda" },
        ],
        icon: "compass",
      };
    case "404-admin":
      return {
        label: "Error 404 · Panel",
        title: "No encontramos esta página",
        docTitle: "Página no encontrada",
        line: "Esta dirección no existe en el panel. Vuelve al panel para seguir con los aportes, o ve al sitio.",
        actions: [
          {
            label: "Ir al panel",
            href: opts.panelHref ?? "/dashboard",
            primary: true,
          },
          HOME,
        ],
        icon: "compass",
      };
    case "500":
      return {
        label: "Error 500",
        title: "Algo salió mal de nuestro lado",
        docTitle: "Algo salió mal",
        line: opts.hasCode
          ? "No es nada que hayas hecho tú. Intenta de nuevo en un momento; si vuelve a pasar, escríbenos con este código y te ayudamos más rápido."
          : "No es nada que hayas hecho tú. Intenta de nuevo en un momento; si sigue pasando, escríbenos y te ayudamos.",
        actions: [RETRY, HOME],
        icon: "alert",
      };
    case "offline":
      return {
        label: "Sin conexión",
        title: "Parece que no tienes conexión",
        docTitle: "Sin conexión",
        line: "No pudimos comunicarnos con el sitio. Revisa tu conexión y vuelve a intentarlo.",
        actions: [RETRY],
        icon: "offline",
      };
    case "maintenance":
      return {
        label: "Mantenimiento",
        title: "Estamos haciendo algunas mejoras",
        docTitle: "En mantenimiento",
        line: opts.hasReturnAt
          ? "El sitio estará en pausa por un rato mientras lo dejamos listo. Gracias por tu paciencia."
          : "El sitio estará en pausa por un rato mientras lo dejamos listo. Volvemos lo antes posible; gracias por tu paciencia.",
        actions: [],
        icon: "tools",
      };
  }
}

/**
 * Código visible para soporte a partir del `digest` que Next adjunta al
 * error (el mismo que queda en los logs del servidor).
 */
export function errorCode(digest: string | undefined): string | undefined {
  if (!digest) return undefined;
  return `MRN-500-${digest.slice(0, 10).toUpperCase()}`;
}

/** "jueves 15 de octubre, 9:00 p. m." en la zona horaria de quien mira. */
export function formatReturnAt(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}
