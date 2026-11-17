"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale, SiteSettings } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import SwirlMark from "@/components/ui/SwirlMark";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Status = "idle" | "sending" | "ok" | "error";

export default function Contact({
  locale,
  t,
  settings,
}: {
  locale: Locale;
  t: Dictionary["contact"];
  settings: SiteSettings;
}) {
  const root = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  useGSAP(
    () => {
      gsap.from(".contact-panel", {
        y: 100,
        scale: 0.94,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    },
    { scope: root },
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const input =
    "w-full rounded-2xl border-0 bg-white/10 px-5 py-4 text-white placeholder:text-white/40 ring-1 ring-white/15 outline-none transition focus:bg-white/15 focus:ring-2 focus:ring-orange";

  return (
    <section ref={root} id="contact" className="py-16 md:py-24">
      <div className="container-x">
        <div className="contact-panel relative overflow-hidden rounded-[2.5rem] bg-navy p-8 text-white md:p-14">
          <div className="pointer-events-none absolute -bottom-40 size-[30rem] rounded-full bg-orange/30 blur-3xl ltr:-right-20 rtl:-left-20" />
          <SwirlMark mono className="pointer-events-none absolute -top-10 h-72 text-white/[0.05] ltr:-right-6 rtl:-left-6" />

          <div className="relative grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow !text-orange">{t.eyebrow}</p>
              <h2 className="mt-4 text-balance text-3xl font-black leading-tight md:text-5xl">{t.title}</h2>
              <p className="mt-4 text-lg text-white/70">{t.subtitle}</p>

              <dl className="mt-10 space-y-6">
                <div>
                  <dt className="text-sm font-bold text-orange">{t.phones}</dt>
                  <dd className="mt-2 flex flex-wrap gap-3">
                    {settings.phones.map((p) => (
                      <a
                        key={p}
                        href={`tel:${p.replace(/\s/g, "")}`}
                        dir="ltr"
                        className="rounded-full bg-white/10 px-4 py-2 font-bold transition hover:bg-orange hover:text-navy-ink"
                      >
                        {p}
                      </a>
                    ))}
                  </dd>
                  <p className="mt-2 text-sm text-white/50">{t.intlNote}</p>
                </div>
                <div>
                  <dt className="text-sm font-bold text-orange">{t.address}</dt>
                  <dd className="mt-2 font-semibold">
                    {settings.address[locale]}{locale === "ar" ? "، " : ", "}{settings.poBox[locale]}
                  </dd>
                </div>
              </dl>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="name" required placeholder={t.form.name} className={input} />
                <input name="phone" required type="tel" placeholder={t.form.phone} className={input} />
              </div>
              <select name="type" className={`${input} appearance-none`} defaultValue="general" aria-label={t.form.type}>
                {Object.entries(t.form.types).map(([k, v]) => (
                  <option key={k} value={k} className="text-navy-ink">
                    {v}
                  </option>
                ))}
              </select>
              <textarea name="message" required rows={5} placeholder={t.form.message} className={`${input} resize-none`} />
              <button type="submit" disabled={status === "sending"} className="btn mt-2 bg-orange text-navy-ink hover:bg-white disabled:opacity-60">
                {status === "sending" ? t.form.sending : t.form.submit}
              </button>
              <p aria-live="polite" className="min-h-6 text-center font-bold">
                {status === "ok" && <span className="text-orange">{t.form.success}</span>}
                {status === "error" && <span className="text-red-300">{t.form.error}</span>}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
