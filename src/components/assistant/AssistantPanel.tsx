"use client";

/**
 * "Ask Al-Arz" chat panel. Streams replies from /api/assistant (SSE) and renders the tool
 * results as cards: products, nearest shops (with map + directions links), distributor leads.
 * Loaded on first open only; stays mounted afterwards so the conversation survives navigation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { CategoryId, FlavorColors, Locale, Localized } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import { pageHref } from "@/i18n/routes";
import ProductArt from "@/components/ui/ProductArt";
import SwirlMark from "@/components/ui/SwirlMark";
import "./assistant.css";

type T = Dictionary["assistant"];
type ToolName = keyof T["working"];

interface ProductCard {
  id: string;
  line: Localized;
  flavor: Localized | null;
  size: Localized | null;
  category: CategoryId;
  colors: FlavorColors;
  image: string | null;
}
interface StoreCard {
  id: number;
  name: string;
  type: "supermarket" | "minimarket" | "mall" | "other";
  city: string | null;
  lat: number;
  lng: number;
  distance: number;
}
type Card =
  | { kind: "products"; items: ProductCard[] }
  | { kind: "stores"; origin: { lat: number; lng: number; label: string }; items: StoreCard[] }
  | { kind: "lead"; ok: boolean };

interface Bubble {
  id: number;
  role: "user" | "assistant";
  text: string;
  cards: Card[];
  error?: string;
}

/** Escape, then allow **bold** and "- " bullet lines. */
function renderText(text: string) {
  const esc = text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  return esc
    .split("\n")
    .map((line) => {
      const l = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return /^\s*[-•]\s+/.test(l) ? `<span class="as-li">${l.replace(/^\s*[-•]\s+/, "")}</span>` : l;
    })
    .join("<br>")
    .replace(/(<\/span>)<br>(<span class="as-li">)/g, "$1$2");
}

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function AssistantPanel({ locale, t, open, onClose }: { locale: Locale; t: T; open: boolean; onClose: () => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  // Gemini keeps the conversation; we only hold the id of the last interaction
  const [conversation, setConversation] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<ToolName | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locState, setLocState] = useState<"idle" | "locating" | "denied">("idle");
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const rec = useRef<SpeechRec | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setCanSpeak(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => field.current?.focus(), 250);
  }, [open]);

  // keep the newest content in view while streaming
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [bubbles, working]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const patchLast = (fn: (b: Bubble) => Bubble) =>
    setBubbles((list) => (list.length ? [...list.slice(0, -1), fn(list[list.length - 1])] : list));

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      setInput("");
      if (turns >= 24) {
        setBubbles((list) => [
          ...list,
          { id: nextId.current++, role: "user", text: q, cards: [] },
          { id: nextId.current++, role: "assistant", text: "", cards: [], error: t.errors.conversation_full },
        ]);
        return;
      }
      setBusy(true);
      setTurns((n) => n + 1);
      setBubbles((list) => [
        ...list,
        { id: nextId.current++, role: "user", text: q, cards: [] },
        { id: nextId.current++, role: "assistant", text: "", cards: [] },
      ]);

      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, location, message: q, interactionId: conversation }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const j = (await res.json().catch(() => ({}))) as { error?: keyof T["errors"] };
          const code = j.error && j.error in t.errors ? j.error : "failed";
          patchLast((b) => ({ ...b, error: t.errors[code] }));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            const ev = JSON.parse(line.slice(5)) as Record<string, unknown> & { type: string };
            switch (ev.type) {
              case "text":
                setWorking(null);
                patchLast((b) => ({ ...b, text: b.text + (ev.text as string) }));
                break;
              case "status":
                setWorking(ev.tool as ToolName);
                break;
              case "products":
                patchLast((b) => ({ ...b, cards: [...b.cards, { kind: "products", items: ev.items as ProductCard[] }] }));
                break;
              case "stores":
                patchLast((b) => ({
                  ...b,
                  cards: [...b.cards, { kind: "stores", origin: ev.origin as { lat: number; lng: number; label: string }, items: ev.items as StoreCard[] }],
                }));
                break;
              case "lead":
                patchLast((b) => ({ ...b, cards: [...b.cards, { kind: "lead", ok: Boolean(ev.ok) }] }));
                break;
              case "reset":
                patchLast((b) => ({ ...b, text: "", cards: [] }));
                break;
              case "refusal":
                patchLast((b) => ({ ...b, error: b.text ? undefined : t.errors.refusal }));
                break;
              case "error":
                patchLast((b) => ({ ...b, error: t.errors[(ev.code as keyof T["errors"]) ?? "failed"] ?? t.errors.failed }));
                break;
              case "done":
                if (ev.interactionId) setConversation(ev.interactionId as string);
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") patchLast((b) => ({ ...b, error: t.errors.failed }));
      } finally {
        setBusy(false);
        setWorking(null);
        abort.current = null;
      }
    },
    [busy, conversation, turns, locale, location, t],
  );

  const reset = () => {
    abort.current?.abort();
    setBubbles([]);
    setConversation(null);
    setTurns(0);
    setBusy(false);
    setWorking(null);
  };

  const shareLocation = () => {
    if (!("geolocation" in navigator)) return setLocState("denied");
    setLocState("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLocation(loc);
        setLocState("idle");
        if (!busy) void ask(locale === "ar" ? "وين أقرب محل إلي؟" : "Where's the nearest shop to me?");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  const toggleMic = () => {
    if (listening) return rec.current?.stop();
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = locale === "ar" ? "ar-JO" : "en-US";
    r.interimResults = true;
    r.onresult = (e) => setInput(Array.from(e.results).map((res) => res[0].transcript).join(" "));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const fmtDist = (m: number) =>
    m < 1000 ? `${formatNumber(Math.max(10, Math.round(m / 10) * 10), locale)} ${t.m}` : `${formatNumber(m / 1000, locale, { maximumFractionDigits: 1 })} ${t.km}`;

  return (
    <div className={clsx("as-panel", open && "is-open")} role="dialog" aria-modal="false" aria-label={t.title} hidden={!open} data-lenis-prevent>
      {/* header */}
      <div className="as-head">
        <span className="as-avatar" aria-hidden>
          <SwirlMark mono className="h-6 w-auto text-navy-ink" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black leading-tight text-white">{t.title}</p>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/65">
            <span className="as-online" />
            {t.status}
          </p>
        </div>
        {bubbles.length > 0 && (
          <button type="button" onClick={reset} className="as-icon-btn" aria-label={t.newChat} title={t.newChat}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}
        <button type="button" onClick={onClose} className="as-icon-btn" aria-label={t.close}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* conversation */}
      <div ref={scroller} className="as-body" aria-live="polite">
        <div className="as-msg as-msg--bot">
          <div className="as-bubble">{t.greeting}</div>
        </div>
        {bubbles.length === 0 && (
          <div className="as-suggest">
            {t.suggestions.map((s, i) => (
              <button key={s} type="button" onClick={() => (i === 1 && !location ? shareLocation() : ask(s))} style={{ "--i": i } as React.CSSProperties}>
                {s}
              </button>
            ))}
          </div>
        )}

        {bubbles.map((b, idx) => {
          const isLast = idx === bubbles.length - 1;
          return (
            <div key={b.id} className={clsx("as-msg", b.role === "user" ? "as-msg--me" : "as-msg--bot")}>
              {b.role === "user" ? (
                <div className="as-bubble">{b.text}</div>
              ) : (
                <>
                  {b.cards.map((c, i) => (
                    <div key={i} className="as-cards">
                      {c.kind === "products" && (
                        <div className="as-products">
                          {c.items.map((p) => (
                            <div key={p.id} className="as-product">
                              <div className="as-product__art" style={{ background: `radial-gradient(circle at 50% 60%, ${p.colors.base}aa, ${p.colors.base}22 72%)` }}>
                                {p.image ? (
                                  <Image src={p.image} alt={p.line[locale]} width={120} height={120} className="h-[82%] w-auto object-contain" />
                                ) : (
                                  <ProductArt id={`as-${p.id}`} category={p.category} colors={p.colors} className="h-[80%] w-auto" />
                                )}
                              </div>
                              <p className="truncate text-sm font-black text-navy">{p.line[locale]}</p>
                              <p className="truncate text-xs font-semibold text-navy-ink/55">{p.flavor?.[locale] ?? p.size?.[locale] ?? " "}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {c.kind === "stores" && (
                        <div className="as-stores">
                          {c.items.map((s, n) => (
                            <div key={s.id} className="as-store">
                              <span className="as-store__rank">{formatNumber(n + 1, locale)}</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-navy">{s.name}</p>
                                <p className="truncate text-xs font-semibold text-navy-ink/55">
                                  {t.types[s.type]}
                                  {s.city ? ` · ${s.city}` : ""} · <b className="text-navy">{fmtDist(s.distance)}</b>
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Link
                                  href={`${pageHref(locale, "stores")}?lat=${c.origin.lat}&lng=${c.origin.lng}&store=${s.id}`}
                                  onClick={onClose}
                                  className="as-mini"
                                  title={t.onMap}
                                  aria-label={`${t.onMap}: ${s.name}`}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
                                    <path d="M9 4v14M15 6v14" />
                                  </svg>
                                </Link>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="as-mini as-mini--solid"
                                  title={t.directions}
                                  aria-label={`${t.directions}: ${s.name}`}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 11l18-8-8 18-2-8z" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {c.kind === "lead" && (
                        <div className={clsx("as-lead", !c.ok && "is-failed")}>
                          <span aria-hidden>{c.ok ? "✓" : "!"}</span>
                          {c.ok ? t.leadSaved : t.leadFailed}
                        </div>
                      )}
                    </div>
                  ))}
                  {(b.text || (isLast && busy && !working && !b.cards.length)) && (
                    <div className="as-bubble">
                      {b.text ? <span dangerouslySetInnerHTML={{ __html: renderText(b.text) }} /> : null}
                      {isLast && busy && !working && <span className={clsx("as-caret", !b.text && "as-dots")} />}
                    </div>
                  )}
                  {isLast && working && <div className="as-working">{t.working[working]}</div>}
                  {b.error && <div className="as-error">{b.error}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* composer */}
      <form
        className="as-foot"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={shareLocation}
            disabled={locState === "locating" || Boolean(location)}
            className={clsx("as-chip", location && "is-on")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {location ? t.locationShared : locState === "locating" ? t.locating : locState === "denied" ? t.locationDenied : t.shareLocation}
          </button>
        </div>
        <div className="as-input">
          <textarea
            ref={field}
            id="as-input"
            rows={1}
            value={input}
            maxLength={800}
            placeholder={listening ? t.listening : t.placeholder}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void ask(input);
              }
            }}
            aria-label={t.placeholder}
          />
          {canSpeak && (
            <button type="button" onClick={toggleMic} className={clsx("as-mic", listening && "is-on")} aria-label={t.mic} title={t.mic}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
              </svg>
            </button>
          )}
          <button type="submit" disabled={busy || !input.trim()} className="as-send" aria-label={t.send}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10.5px] font-semibold text-navy-ink/40">{t.disclaimer}</p>
      </form>
    </div>
  );
}
