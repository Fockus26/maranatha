import { afterEach, describe, expect, test } from "bun:test";
import {
  errorCode,
  formatReturnAt,
  getStatusCopy,
} from "@/components/status/statusCopy";
import {
  bypassesMaintenance,
  maintenanceOn,
  maintenanceUntil,
  retryAfterSeconds,
} from "@/lib/maintenance";

describe("copy de las pantallas de estado (D079)", () => {
  test("404 de visitante: inicio y reuniones; de admin: panel e inicio", () => {
    expect(getStatusCopy("404").actions.map((a) => a.label)).toEqual([
      "Ir al inicio",
      "Ver reuniones",
    ]);
    const admin = getStatusCopy("404-admin", { panelHref: "https://admin.x/" });
    expect(admin.actions[0]).toMatchObject({
      label: "Ir al panel",
      href: "https://admin.x/",
      primary: true,
    });
  });

  test("500 cambia la línea si hay código y ofrece reintentar", () => {
    const con = getStatusCopy("500", { hasCode: true });
    const sin = getStatusCopy("500");
    expect(con.line).toContain("este código");
    expect(sin.line).not.toContain("código");
    expect(con.actions[0]).toMatchObject({ label: "Reintentar" });
    expect(con.actions[0].href).toBeUndefined();
  });

  test("mantenimiento no tiene acciones", () => {
    expect(getStatusCopy("maintenance").actions).toHaveLength(0);
  });

  test("código de error a partir del digest", () => {
    expect(errorCode(undefined)).toBeUndefined();
    expect(errorCode("1234567890abcdef")).toBe("MRN-500-1234567890");
  });

  // El primer `Intl.DateTimeFormat` con zona horaria carga los datos de ICU:
  // con la máquina cargada pasaba de los 5 s por defecto y daba un timeout
  // falso (olas 4 y 5 de la fase shadcn). Sin carga tarda milisegundos.
  test(
    "hora de regreso en es-VE, en la zona indicada",
    () => {
      const s = formatReturnAt(
        new Date("2026-10-16T01:00:00Z"),
        "America/Caracas",
      );
      expect(s).toContain("jueves");
      expect(s).toContain("15 de octubre");
    },
    { timeout: 30_000 },
  );
});

describe("modo mantenimiento", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  test("se activa solo con MAINTENANCE_MODE=1", () => {
    process.env.MAINTENANCE_MODE = "";
    expect(maintenanceOn()).toBe(false);
    process.env.MAINTENANCE_MODE = "1";
    expect(maintenanceOn()).toBe(true);
  });

  test("hora inválida se ignora; Retry-After hasta la hora o 1 h", () => {
    process.env.MAINTENANCE_UNTIL = "mañana";
    expect(maintenanceUntil()).toBeNull();
    expect(retryAfterSeconds()).toBe(3600);
    process.env.MAINTENANCE_UNTIL = "2026-10-15T21:00:00Z";
    expect(retryAfterSeconds(new Date("2026-10-15T20:00:00Z"))).toBe(3600);
    expect(retryAfterSeconds(new Date("2026-10-16T00:00:00Z"))).toBe(60);
  });

  test("el panel, la API y los archivos no pasan a mantenimiento", () => {
    for (const p of [
      "/dashboard",
      "/dashboard/pagos",
      "/api/payments/x",
      "/brand/logo-mark.svg",
      "/mantenimiento",
    ]) {
      expect(bypassesMaintenance(p)).toBe(true);
    }
    for (const p of ["/", "/proyectos", "/pago/resultado"]) {
      expect(bypassesMaintenance(p)).toBe(false);
    }
  });
});
