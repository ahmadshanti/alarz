/**
 * "Ask Al-Arz" tools — provider-independent. Each tool has a JSON schema (sent to the model),
 * a zod schema (validates what the model sends back before anything runs) and a run function.
 * Results go back to the model as text and to the browser as card events.
 */
import "server-only";
import { z } from "zod";
import { saveContactMessage, type StorePoint } from "@/lib/cms";
import type { Locale } from "@/content/types";
import { findPlace, normalize } from "./places";
import type { getKnowledge } from "./knowledge";

type Knowledge = Awaited<ReturnType<typeof getKnowledge>>;
export type SendEvent = (event: Record<string, unknown>) => void;

export interface ToolContext {
  locale: Locale;
  location: { lat: number; lng: number } | null;
  knowledge: Knowledge;
  send: SendEvent;
  /** returns true when this caller is over a limit */
  limited: (key: string, max: number, windowMs: number) => boolean;
}

export interface AssistantTool {
  name: string;
  description: string;
  /** JSON schema for the model */
  parameters: Record<string, unknown>;
  /** validates the model's arguments; failures go back to the model as an error result */
  input: z.ZodType;
  run: (args: never, ctx: ToolContext) => Promise<string>;
}

const distanceM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371e3;
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* ------------------------------------------------------------------ */

const ShowProducts = z.object({
  ids: z.array(z.string().max(40)).max(8).optional(),
  query: z.string().max(80).optional(),
  category: z.enum(["single", "family", "occasion"]).optional(),
  limit: z.number().int().min(1).max(8).optional(),
});

const showProducts: AssistantTool = {
  name: "show_products",
  description:
    "Show Al-Arz products to the visitor as cards. Pass catalogue ids when you know them, or a search query (product line or flavour, Arabic or English), optionally a category. Returns the shown products.",
  parameters: {
    type: "object",
    properties: {
      ids: { type: "array", items: { type: "string" }, description: "Product ids from the catalogue (max 8)" },
      query: { type: "string", description: "Product line or flavour, e.g. 'تشارمز', 'pistachio', 'كابتن'" },
      category: { type: "string", enum: ["single", "family", "occasion"] },
      limit: { type: "integer", description: "How many cards (1-8, default 4)" },
    },
  },
  input: ShowProducts,
  run: async (args: z.infer<typeof ShowProducts>, { knowledge, send }) => {
    const { ids, query, category, limit } = args;
    let list = knowledge.products;
    if (ids?.length) list = list.filter((p) => ids.includes(p.id));
    else if (query) {
      const q = normalize(query);
      list = list.filter((p) => [p.line.ar, p.line.en, p.flavor?.ar, p.flavor?.en].some((s) => s && normalize(s).includes(q)));
    }
    if (category) list = list.filter((p) => p.category === category);
    list = list.slice(0, limit ?? 4);
    send({
      type: "products",
      items: list.map((p) => ({
        id: p.id,
        line: p.line,
        flavor: p.flavor ?? null,
        size: p.size ?? null,
        category: p.category,
        colors: p.colors,
        image: p.image?.url ?? null,
      })),
    });
    if (!list.length) return "No matching products. Suggest something close from the catalogue.";
    return JSON.stringify(list.map((p) => ({ id: p.id, line: p.line, flavor: p.flavor, size: p.size, category: p.category })));
  },
};

/* ------------------------------------------------------------------ */

const FindStores = z.object({
  place: z.string().max(80).optional(),
  use_my_location: z.boolean().optional(),
  type: z.enum(["supermarket", "minimarket", "mall"]).optional(),
  limit: z.number().int().min(1).max(6).optional(),
});

const findNearestStores: AssistantTool = {
  name: "find_nearest_stores",
  description:
    "Find the nearest shops that sell Al-Arz, shown to the visitor as cards with distance and a map link. Use the visitor's shared location (use_my_location) or a place name (town, neighbourhood, landmark).",
  parameters: {
    type: "object",
    properties: {
      place: { type: "string", description: "Town / area / landmark, e.g. 'رفيديا', 'Ramallah', 'جامعة النجاح'" },
      use_my_location: { type: "boolean", description: "Use the location the visitor shared" },
      type: { type: "string", enum: ["supermarket", "minimarket", "mall"] },
      limit: { type: "integer", description: "How many shops (1-6, default 4)" },
    },
  },
  input: FindStores,
  run: async (args: z.infer<typeof FindStores>, { locale, location, knowledge, send }) => {
    const { place, use_my_location, type, limit } = args;
    let origin: { lat: number; lng: number; label: string } | null = null;
    if ((use_my_location || !place) && location) {
      origin = { ...location, label: locale === "ar" ? "موقعك" : "Your location" };
    } else if (place) {
      const found = findPlace(place);
      if (found) origin = { lat: found.lat, lng: found.lng, label: found.label[locale] };
    }
    if (!origin) {
      send({ type: "need_location" });
      return place
        ? `UNKNOWN_PLACE "${place}". Ask for a nearby town or a well-known landmark, or suggest the Share my location button.`
        : "NO_LOCATION. The visitor has not shared their location. Ask for their town/area, or suggest the Share my location button.";
    }
    const from = origin;
    const ranked = knowledge.stores
      .filter((s: StorePoint) => !type || s.type === type)
      .map((s) => ({ s, d: distanceM(from, s) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limit ?? 4);
    send({
      type: "stores",
      origin: from,
      items: ranked.map(({ s, d }) => ({
        id: s.id,
        name: locale === "en" && s.nameEn ? s.nameEn : s.name,
        type: s.type,
        city: s.city ?? null,
        lat: s.lat,
        lng: s.lng,
        distance: Math.round(d),
      })),
    });
    return JSON.stringify({
      near: from.label,
      shops: ranked.map(({ s, d }) => ({ name: s.name, type: s.type, city: s.city, metres: Math.round(d) })),
    });
  },
};

/* ------------------------------------------------------------------ */

const Lead = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(30),
  city: z.string().min(2).max(60),
  shop_type: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

const submitDistributorRequest: AssistantTool = {
  name: "submit_distributor_request",
  description:
    "Save a request to become an Al-Arz distributor / wholesale customer, for the sales team to call back. Only call after the visitor has confirmed the details you read back.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      phone: { type: "string" },
      city: { type: "string" },
      shop_type: { type: "string", description: "e.g. supermarket, minimarket, café" },
      notes: { type: "string" },
    },
    required: ["name", "phone", "city"],
  },
  input: Lead,
  run: async (args: z.infer<typeof Lead>, { locale, send, limited }) => {
    const { name, phone, city, shop_type, notes } = args;
    if (!/^[+\d][\d\s-]{5,}$/.test(phone.trim())) return "INVALID_PHONE. Ask the visitor to re-type the phone number.";
    if (limited("lead", 3, 60 * 60_000)) return "TOO_MANY_REQUESTS. Ask them to call the phone numbers instead.";
    const message = [
      `${locale === "ar" ? "المدينة" : "City"}: ${city}`,
      shop_type ? `${locale === "ar" ? "نوع المحل" : "Shop type"}: ${shop_type}` : "",
      notes ? `${locale === "ar" ? "ملاحظات" : "Notes"}: ${notes}` : "",
      locale === "ar" ? "(عن طريق مساعد «اسأل الآرز»)" : "(via the Ask Al-Arz assistant)",
    ]
      .filter(Boolean)
      .join("\n");
    const saved = await saveContactMessage({ name, phone, type: "distributor", message, locale });
    send({ type: "lead", ok: saved, name, city });
    return saved ? "SAVED. Thank them; the sales team will call them soon." : "NOT_SAVED (storage unavailable). Apologise and give the phone numbers.";
  },
};

export const TOOLS: AssistantTool[] = [showProducts, findNearestStores, submitDistributorRequest];

/** Validate and run one tool call. Never throws: errors become a result the model can read. */
export async function runTool(name: string, rawArgs: unknown, ctx: ToolContext): Promise<{ text: string; isError: boolean }> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { text: `UNKNOWN_TOOL ${name}`, isError: true };
  const parsed = tool.input.safeParse(rawArgs ?? {});
  if (!parsed.success) return { text: `INVALID_ARGUMENTS: ${parsed.error.issues.map((i) => i.message).join("; ")}`, isError: true };
  try {
    return { text: await tool.run(parsed.data as never, ctx), isError: false };
  } catch (err) {
    console.error(`[assistant] tool ${name} failed`, err);
    return { text: "TOOL_FAILED. Apologise briefly and offer the phone numbers.", isError: true };
  }
}
