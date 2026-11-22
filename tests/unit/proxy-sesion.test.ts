import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

// QA de versión 09: sin sesión, el proxy solo redirige al login las
// navegaciones; los POST de Server Actions pasan y la acción responde
// `unauthorized` ("Tu sesión expiró").
const url = "http://localhost:3000/dashboard/agenda";

describe("proxy sin sesión en el panel", () => {
  test("GET redirige al login", async () => {
    const res = await proxy(new NextRequest(url));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard/login");
  });

  test("HEAD redirige al login", async () => {
    const res = await proxy(new NextRequest(url, { method: "HEAD" }));
    expect(res.status).toBe(307);
  });

  test("POST de Server Action no se redirige", async () => {
    const res = await proxy(
      new NextRequest(url, { method: "POST", headers: { "Next-Action": "x" } }),
    );
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
