import { describe, expect, test } from "bun:test";
import {
  afterQuery,
  decideFreshness,
  FRESHNESS_THROTTLE_MS,
  type KnownVersion,
} from "@/lib/panelFreshness";

// D104: chequeo de frescura del panel. El reloj del servidor (`at`) ordena
// versiones; el del navegador (`checkedAt`, `now`) solo cuenta el throttle.

const v = (token: string, at: number) => ({ token, at });
const known = (token: string, at: number, checkedAt: number): KnownVersion => ({
  token,
  at,
  checkedAt,
});

describe("decideFreshness", () => {
  test("primera página del scope: se adopta como lo sabido, sin consultar", () => {
    const d = decideFreshness(v("3|a", 1000), null, 50_000);
    expect(d).toEqual({ action: "fresh", known: known("3|a", 1000, 50_000) });
  });

  test("página renderizada después de lo sabido (acción del propio admin): se adopta, no refresca", () => {
    // El admin aprobó: revalidatePath vació la caché y la página trae otro token.
    const d = decideFreshness(
      v("3|b", 2000),
      known("3|a", 1000, 40_000),
      45_000,
    );
    expect(d.action).toBe("fresh");
    expect(d.known).toEqual(known("3|b", 2000, 45_000));
  });

  test("filtro cacheado más viejo que lo sabido y con otro token: refresca sin consultar", () => {
    const d = decideFreshness(
      v("3|a", 1000),
      known("4|c", 3000, 40_000),
      41_000,
    );
    expect(d.action).toBe("refresh");
  });

  test("mismo token y chequeado hace poco: nada", () => {
    const d = decideFreshness(
      v("3|a", 1000),
      known("3|a", 3000, 40_000),
      40_000 + FRESHNESS_THROTTLE_MS - 1,
    );
    expect(d.action).toBe("fresh");
  });

  test("mismo token pero pasado el throttle: consulta", () => {
    const d = decideFreshness(
      v("3|a", 1000),
      known("3|a", 1000, 40_000),
      40_000 + FRESHNESS_THROTTLE_MS,
    );
    expect(d.action).toBe("query");
  });

  test("tras un refresco la página nueva es más reciente: no hay ciclo", () => {
    const k = known("4|c", 3000, 40_000);
    expect(decideFreshness(v("3|a", 1000), k, 41_000).action).toBe("refresh");
    const after = decideFreshness(v("4|c", 3500), k, 41_200);
    expect(after.action).toBe("fresh");
    expect(decideFreshness(v("4|c", 3500), after.known, 41_300).action).toBe(
      "fresh",
    );
  });
});

describe("afterQuery", () => {
  test("con respuesta: lo sabido es lo que dijo el servidor", () => {
    expect(afterQuery(known("3|a", 1000, 1), v("5|d", 9000), 60_000)).toEqual(
      known("5|d", 9000, 60_000),
    );
  });

  test("si falló: se conserva lo sabido y el throttle frena el reintento", () => {
    const k = afterQuery(known("3|a", 1000, 1), null, 60_000);
    expect(k).toEqual(known("3|a", 1000, 60_000));
    expect(decideFreshness(v("3|a", 1000), k, 60_001).action).toBe("fresh");
  });
});
