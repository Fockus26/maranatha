import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

// Módulo server-only; en los tests no hay frontera cliente/servidor.
mock.module("server-only", () => ({}));
const receipts = await import("@/lib/payments/receipts");

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const R2 = {
  R2_ACCOUNT_ID: "acct123",
  R2_ACCESS_KEY_ID: "test-key-id",
  R2_SECRET_ACCESS_KEY: "test-secret",
  R2_BUCKET: "maranatha-receipts-test",
};

type Call = {
  url: string;
  method: string;
  headers: Headers;
  body?: Uint8Array;
};
let calls: Call[] = [];
let reply: (call: Call) => Response;
const realFetch = globalThis.fetch;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  calls = [];
  reply = () => new Response(null, { status: 200 });
  for (const [k, v] of Object.entries(R2)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
  saved.DATABASE_URL = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    const body = req.body ? new Uint8Array(await req.arrayBuffer()) : undefined;
    const call = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body,
    };
    calls.push(call);
    return reply(call);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("D094 · comprobantes en R2", () => {
  test("sube al bucket del entorno, firmado y con el tipo por los bytes", async () => {
    const up = await receipts.uploadReceipt(new File([PNG], "foto.jpg"));
    expect(up.ok).toBe(true);
    if (!up.ok) return;
    expect(up.path).toMatch(/^\d{4}-\d{2}\/[0-9a-f-]{36}\.png$/);
    expect(calls).toHaveLength(1);
    const [put] = calls;
    expect(put.method).toBe("PUT");
    expect(put.url).toBe(
      `https://acct123.r2.cloudflarestorage.com/maranatha-receipts-test/${up.path}`,
    );
    expect(put.headers.get("content-type")).toBe("image/png");
    expect(put.headers.get("authorization")).toContain("AWS4-HMAC-SHA256");
    expect(put.body).toEqual(PNG);
  });

  test("un fallo de R2 es upload_failed, sin caer en la tabla", async () => {
    reply = () => new Response("nope", { status: 403 });
    const up = await receipts.uploadReceipt(new File([PNG], "x.png"));
    expect(up).toEqual({ ok: false, error: "upload_failed" });
  });

  test("lo que no es imagen ni PDF no llega al bucket", async () => {
    const up = await receipts.uploadReceipt(new File(["<svg/>"], "x.png"));
    expect(up).toEqual({ ok: false, error: "invalid_receipt" });
    expect(calls).toHaveLength(0);
  });

  test("lee del bucket y vuelve a validar los bytes", async () => {
    const path = "2026-11/0b7c3e1a-6f2d-4c1e-9a8b-1234567890ab.png";
    reply = () =>
      new Response(PNG, { headers: { "Content-Type": "text/html" } });
    const got = await receipts.getReceipt(path);
    expect(got?.mime).toBe("image/png");
    expect(new Uint8Array(got?.bytes ?? [])).toEqual(PNG);

    reply = () => new Response("<html>", { status: 200 });
    expect(await receipts.getReceipt(path)).toBeNull();
  });

  test("404 en el bucket sin base configurada → null", async () => {
    reply = () => new Response(null, { status: 404 });
    const got = await receipts.getReceipt(
      "2026-10/0b7c3e1a-6f2d-4c1e-9a8b-1234567890ab.pdf",
    );
    expect(got).toBeNull();
    expect(calls).toHaveLength(1);
  });

  test("un path con otra forma no se pide al bucket", async () => {
    expect(await receipts.getReceipt("../../otro-bucket/x.png")).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("borra del bucket", async () => {
    const path = "2026-11/0b7c3e1a-6f2d-4c1e-9a8b-1234567890ab.webp";
    await receipts.deleteReceipt(path);
    expect(calls.map((c) => c.method)).toEqual(["DELETE"]);
  });

  test("sin R2_* ni base, subir falla sin red", async () => {
    delete process.env.R2_BUCKET;
    expect(receipts.receiptBucket()).toBeNull();
    const up = await receipts.uploadReceipt(new File([PNG], "x.png"));
    expect(up).toEqual({ ok: false, error: "upload_failed" });
    expect(calls).toHaveLength(0);
  });
});
