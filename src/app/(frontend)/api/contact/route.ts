import { NextResponse } from "next/server";
import { saveContactMessage, type ContactMessage } from "@/lib/cms";

const TYPES = ["general", "distributor", "feedback"] as const;

/**
 * Contact form endpoint: validates, then stores the message in the CMS "messages" collection.
 * (The public REST API cannot create messages — only this route can, via overrideAccess.)
 * TODO: email the sales team once an email adapter is configured (see README).
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
  const type: ContactMessage["type"] = TYPES.includes(body.type as (typeof TYPES)[number])
    ? (body.type as ContactMessage["type"])
    : "general";
  const locale: ContactMessage["locale"] = body.locale === "en" ? "en" : "ar";

  if (name.length < 2 || phone.length < 6 || message.length < 2) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }
  if (name.length > 120 || phone.length > 30 || message.length > 4000) {
    return NextResponse.json({ error: "too_long" }, { status: 422 });
  }

  try {
    await saveContactMessage({ name, phone, type, message, locale });
  } catch (err) {
    console.error("[contact] could not save message", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
