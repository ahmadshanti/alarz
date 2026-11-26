"use client";

/**
 * Floating "Ask Al-Arz" button on every page. The chat panel's code is downloaded on first
 * open only, then kept mounted so the conversation survives page navigation.
 */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import SwirlMark from "@/components/ui/SwirlMark";
import "./launcher.css";

const AssistantPanel = dynamic(() => import("./AssistantPanel"), { ssr: false });

export default function AssistantLauncher({ locale, t }: { locale: Locale; t: Dictionary["assistant"] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nudge, setNudge] = useState(false);

  // a gentle label next to the button after a few seconds, once per visit
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("as-nudge") === "1";
    } catch {}
    if (seen) return;
    const id = setTimeout(() => setNudge(true), 4500);
    return () => clearTimeout(id);
  }, []);

  const toggle = () => {
    setMounted(true);
    setOpen((v) => !v);
    setNudge(false);
    try {
      sessionStorage.setItem("as-nudge", "1");
    } catch {}
  };

  return (
    <>
      {mounted && <AssistantPanel locale={locale} t={t} open={open} onClose={() => setOpen(false)} />}
      <div className={clsx("as-launch", open && "is-open")}>
        {nudge && !open && (
          <button type="button" onClick={toggle} className="as-nudge">
            {t.greeting.split(/[.!؟?]/)[0]}…
          </button>
        )}
        <button type="button" onClick={toggle} aria-expanded={open} aria-label={open ? t.close : t.open} className="as-fab">
          <span className="as-fab__ring" aria-hidden />
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <SwirlMark mono className="h-7 w-auto" />
          )}
          <span className="as-fab__label">{t.open}</span>
        </button>
      </div>
    </>
  );
}
