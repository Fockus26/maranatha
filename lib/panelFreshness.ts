/**
 * Chequeo de frescura del panel (D104): decide, sin red, si la página que se
 * está mostrando —recién pedida o sacada de la caché del router (D103)— sigue
 * al día, hay que preguntarle al servidor o hay que refrescarla.
 *
 * Puro y compartido: lo usa `components/ui/PanelFreshness.tsx` en el cliente y
 * lo prueban los tests de `tests/unit/panel-freshness.test.ts`.
 */

export type PanelScope = "payments" | "agenda";

/**
 * Versión de los datos de un scope tal como la vio el servidor.
 * - `token`: `count(*)` + `max(updated_at)` (string opaco: solo se compara).
 * - `at`: reloj del servidor (ms) cuando se calculó. Sirve para saber cuál de
 *   dos versiones es la más nueva sin mezclar relojes con el navegador.
 */
export interface PanelVersion {
  token: string;
  at: number;
}

/** Lo último que el navegador sabe del servidor para un scope. */
export interface KnownVersion extends PanelVersion {
  /** Reloj del navegador (ms) cuando se supo: base del throttle. */
  checkedAt: number;
}

/** No más de una consulta por scope en este lapso. */
export const FRESHNESS_THROTTLE_MS = 15_000;

export type FreshnessDecision =
  /** La página coincide con lo último sabido y eso es reciente. */
  | { action: "fresh"; known: KnownVersion }
  /** Lo último sabido es más nuevo que la página y distinto: refrescar. */
  | { action: "refresh"; known: KnownVersion }
  /** No hay nada reciente: preguntarle al servidor. */
  | { action: "query"; known: KnownVersion };

/**
 * `rendered` es la versión con la que se renderizó la página; `known`, lo
 * último que se supo del servidor (de otra página del mismo scope o de una
 * consulta). Una página renderizada después de lo sabido pasa a ser lo sabido
 * (así una acción del propio admin, que revalida y re-renderiza, no se toma
 * por un cambio externo y no entra en un ciclo de refrescos).
 */
export function decideFreshness(
  rendered: PanelVersion,
  known: KnownVersion | null,
  now: number,
  throttleMs: number = FRESHNESS_THROTTLE_MS,
): FreshnessDecision {
  if (!known || rendered.at > known.at) {
    return { action: "fresh", known: { ...rendered, checkedAt: now } };
  }
  if (known.token !== rendered.token) return { action: "refresh", known };
  if (now - known.checkedAt < throttleMs) return { action: "fresh", known };
  return { action: "query", known };
}

/**
 * Lo que se sabe tras consultar. Si la consulta falló, se conserva lo sabido
 * pero se marca la hora: el throttle también frena los reintentos.
 */
export function afterQuery(
  previous: KnownVersion,
  result: PanelVersion | null,
  now: number,
): KnownVersion {
  return { ...(result ?? previous), checkedAt: now };
}
