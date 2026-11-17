import { NextResponse } from "next/server";

const TYPES = ["general", "distributor", "feedback"] as const;

/**
 * Contact form endpoint.
 * TODO (CMS phase): save to the Payload "messages" collection and email the sales team.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const type = TYPES.includes(body.type as (typeof TYPES)[number]) ? body.type : "general";

  if (name.length < 2 || phone.length < 6 || message.length < 2) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }
  if (name.length > 120 || phone.length > 30 || message.length > 4000) {
    return NextResponse.json({ error: "too_long" }, { status: 422 });
  }

  // Placeholder until the CMS is connected
  console.info("[contact]", { name, phone, type, message: message.slice(0, 200) });

  return NextResponse.json({ ok: true });
}
