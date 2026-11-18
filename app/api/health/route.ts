// kit-deploy · copied to the project as `app/api/health/route.ts`.
// The switch starts the new container beside the old one and only moves traffic once this
// answers 2xx (kit-agent `health.check`). Keep it cheap: no database call, no auth.
import { connection } from "next/server";

export async function GET(): Promise<Response> {
  // Request time, never prerendered: the answer must come from the running container.
  await connection();
  return Response.json(
    { ok: true, sha: process.env.GIT_SHA ?? null },
    { headers: { "cache-control": "no-store" } },
  );
}
