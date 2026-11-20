import { describe, expect, test } from "bun:test";
import { initialsOf, realName } from "@/lib/auth/initials";

const EMAIL = "pastor@maranatha.org";

describe("initialsOf", () => {
  test("nombre y apellido → primera letra de cada uno", () => {
    expect(initialsOf("Kevin Pérez", EMAIL)).toBe("KP");
  });

  test("varias palabras → primera y última", () => {
    expect(initialsOf("José Luis Rodríguez Márquez", EMAIL)).toBe("JM");
  });

  test("ignora partículas al elegir el último apellido", () => {
    expect(initialsOf("María de la Rosa", EMAIL)).toBe("MR");
    expect(initialsOf("Ana Gómez del Valle", EMAIL)).toBe("AV");
    expect(initialsOf("Luis de los", EMAIL)).toBe("L");
    expect(initialsOf("Pedro Ruiz y Gómez", EMAIL)).toBe("PG");
  });

  test("una partícula en mayúscula sí es apellido", () => {
    expect(initialsOf("Carla De", EMAIL)).toBe("CD");
  });

  test("una sola palabra → una letra", () => {
    expect(initialsOf("Kevin", EMAIL)).toBe("K");
  });

  test("respeta tildes y ñ", () => {
    expect(initialsOf("Ángel Núñez", EMAIL)).toBe("ÁN");
    expect(initialsOf("ñandú ñu", EMAIL)).toBe("ÑÑ");
    // "É" descompuesta (E + acento combinante) sale compuesta.
    expect(initialsOf("Érica Sosa", EMAIL)).toBe("ÉS");
  });

  test("minúsculas y espacios de más", () => {
    expect(initialsOf("  kevin   pérez ", EMAIL)).toBe("KP");
  });

  test("sin nombre o con el valor por defecto → primera letra del correo", () => {
    expect(initialsOf("", EMAIL)).toBe("P");
    expect(initialsOf("   ", EMAIL)).toBe("P");
    expect(initialsOf(null, EMAIL)).toBe("P");
    expect(initialsOf("Administrador", EMAIL)).toBe("P");
    expect(initialsOf("administrador ", "ángela@x.com")).toBe("Á");
  });

  test("salta signos que no son letras", () => {
    expect(initialsOf("(Kevin) -Pérez", EMAIL)).toBe("KP");
    expect(initialsOf("123 ---", "1kevin@x.com")).toBe("K");
  });
});

describe("realName", () => {
  test("devuelve el nombre limpio o null", () => {
    expect(realName("  Kevin  Pérez ")).toBe("Kevin Pérez");
    expect(realName("Administrador")).toBeNull();
    expect(realName("")).toBeNull();
    expect(realName(undefined)).toBeNull();
  });
});
