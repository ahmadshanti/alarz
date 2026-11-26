/**
 * "Ask Al-Arz" — streaming chat endpoint (Server-Sent Events), powered by Google Gemini
 * (Interactions API, free tier).
 *
 * The conversation is kept by Gemini (store + previous_interaction_id): the browser only holds
 * the last interaction id, so history can't be tampered with and requests stay small.
 * Function calls stream in pieces; we assemble them, validate with zod, run them here
 * (src/lib/assistant/tools.ts) and send the results back, up to MAX_HOPS times per message.
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getKnowledge } from "@/lib/assistant/knowledge";
import { TOOLS, runTool } from "@/lib/assistant/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Free-tier models, tried in order: if one is overloaded (503) or out of quota (429), the next
 * takes the same request. The "flash-lite" models answer in ~1-3 s and have far larger free
 * daily quotas than the big models (gemini-4-hydrogen allows 20 requests/day on the free tier).
 */
const MODELS = [process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"].filter(
  (m, i, all) => all.indexOf(m) === i,
);
const isLite = (m: string) => m.includes("lite");
const MAX_USER_CHARS = 800;
const MAX_HOPS = 4;

/* ------------------------------------------------------------------ */
/* Best-effort rate limits (per server instance)                        */
/* ------------------------------------------------------------------ */

const hits = new Map<string, number[]>();
function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return true;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

const Body = z.object({
  locale: z.enum(["ar", "en"]),
  message: z.string().trim().min(1).max(MAX_USER_CHARS),
  interactionId: z.string().max(200).nullish(),
  location: z.object({ lat: z.number().min(29).max(34), lng: z.number().min(33.5).max(36.5) }).nullish(),
});

/** HTTP status carried by SDK errors, when there is one. */
const statusOf = (err: unknown) => {
  const s = (err as { status?: unknown; statusCode?: unknown })?.status ?? (err as { statusCode?: unknown })?.statusCode;
  return typeof s === "number" ? s : undefined;
};

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(`chat:${ip}`, 20, 10 * 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const { locale, message, interactionId, location } = body;

  const knowledge = await getKnowledge();
  const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY / GOOGLE_API_KEY
  const encoder = new TextEncoder();

  const tools = TOOLS.map((t) => ({ type: "function" as const, name: t.name, description: t.description, parameters: t.parameters }));
  const system =
    knowledge.system[locale] +
    (location ? "\n\nThe visitor has shared their location — use find_nearest_stores with use_my_location." : "");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      const ctx = {
        locale,
        location: location ?? null,
        knowledge,
        send,
        limited: (key: string, max: number, windowMs: number) => limited(`${key}:${ip}`, max, windowMs),
      };

      let previous = interactionId ?? undefined;
      // first hop sends the visitor's text; later hops send function results
      let input: string | Array<Record<string, unknown>> = message;

      try {
        for (let hop = 0; hop < MAX_HOPS; hop++) {
          const open = (model: string) =>
            ai.interactions.create(
              {
                model,
                input: input as never,
                previous_interaction_id: previous,
                system_instruction: system,
                tools,
                // lite models: minimal thinking = fastest replies; others: low
                generation_config: { thinking_level: isLite(model) ? "minimal" : "low", max_output_tokens: 4096 },
                store: true,
                stream: true,
              },
              // no automatic retries (they burn the free daily quota); stop if the visitor closes the chat
              { fetch_options: { signal: req.signal }, timeout_ms: 25_000, retries: { strategy: "none" } },
            );
          let events: Awaited<ReturnType<typeof open>> | null = null;
          let lastErr: unknown;
          for (const model of MODELS) {
            try {
              events = await open(model);
              break;
            } catch (err) {
              lastErr = err;
              const status = statusOf(err);
              if (req.signal.aborted || (status !== 429 && status !== 503)) throw err;
              console.warn(`[assistant] ${model} unavailable (${status}), trying the next model`);
            }
          }
          if (!events) throw lastErr;

          let currentId: string | undefined;
          const calls = new Map<number, { id: string; name: string; args: string; preset?: unknown }>();
          let failed: string | undefined;

          for await (const ev of events) {
            switch (ev.event_type) {
              case "interaction.created":
              case "interaction.completed":
                if (ev.interaction?.id) currentId = ev.interaction.id;
                break;
              case "step.start":
                if (ev.step.type === "function_call") {
                  const step = ev.step as { id: string; name: string; arguments?: unknown };
                  calls.set(ev.index, { id: step.id, name: step.name, args: "", preset: step.arguments });
                  send({ type: "status", tool: step.name });
                }
                break;
              case "step.delta":
                if (ev.delta.type === "text") send({ type: "text", text: ev.delta.text });
                else if (ev.delta.type === "arguments_delta") {
                  const c = calls.get(ev.index);
                  if (c) c.args += ev.delta.arguments ?? "";
                }
                break;
              case "error":
                failed = ev.error?.code ?? "error";
                break;
            }
          }
          if (failed) throw Object.assign(new Error(`stream error: ${failed}`), { code: failed });
          previous = currentId ?? previous;

          if (!calls.size) break; // a normal answer — done

          // run every call of this step, then send all results back together
          const results: Array<Record<string, unknown>> = [];
          for (const c of calls.values()) {
            let args: unknown = c.preset;
            if (c.args) {
              try {
                args = JSON.parse(c.args);
              } catch {
                results.push({ type: "function_result", name: c.name, call_id: c.id, is_error: true, result: "INVALID_JSON arguments" });
                continue;
              }
            }
            const out = await runTool(c.name, args, ctx);
            results.push({ type: "function_result", name: c.name, call_id: c.id, is_error: out.isError || undefined, result: out.text });
          }
          input = results;
        }

        send({ type: "done", interactionId: previous ?? null });
      } catch (err) {
        if (!req.signal.aborted) {
          const status = statusOf(err);
          const code = status === 429 ? "busy" : status === 401 || status === 403 ? "not_configured" : "failed";
          console.error("[assistant]", status ?? "", err instanceof Error ? err.message : err);
          send({ type: "error", code });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
