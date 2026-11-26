"use client";

/**
 * "Ice cream on your table": the Charms bar in augmented reality.
 * - <model-viewer> (Google) renders the real-size GLB and launches AR:
 *   Android → Scene Viewer / WebXR, iPhone → Quick Look (USDZ generated on the fly).
 * - On a computer, a QR code opens the same viewer on the phone.
 * The viewer script (~280 KB gzipped, with its own three.js) loads only when this opens.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import QRCode from "qrcode";
import type { CharmsFlavor, Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import "./ar.css";

const VIEWER_SRC = "/vendor/model-viewer-4.4.0.min.js";
const modelUrl = (flavor: string) => `/models/charms-${flavor}.glb`;

type ModelViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR: () => Promise<void>;
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

let viewerScript: Promise<void> | null = null;
function loadViewer() {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  viewerScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = VIEWER_SRC;
    s.onload = () => customElements.whenDefined("model-viewer").then(() => resolve());
    s.onerror = () => {
      viewerScript = null;
      reject(new Error("model-viewer failed to load"));
    };
    document.head.appendChild(s);
  });
  return viewerScript;
}

const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

export default function ArViewer({
  locale,
  t,
  flavors,
  initialFlavor,
  onClose,
}: {
  locale: Locale;
  t: Dictionary["ar"];
  flavors: CharmsFlavor[];
  initialFlavor: string;
  onClose: () => void;
}) {
  const [flavor, setFlavor] = useState(initialFlavor);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canAR, setCanAR] = useState<boolean | null>(null);
  const [qr, setQr] = useState("");
  const [failed, setFailed] = useState(false);
  const viewer = useRef<ModelViewerElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touch = isTouchDevice();
  const current = flavors.find((f) => f.id === flavor) ?? flavors[0];

  useEffect(() => {
    loadViewer().then(
      () => setReady(true),
      () => setFailed(true),
    );
  }, []);

  // QR code for computers: opens the home page on the phone with this viewer already open
  useEffect(() => {
    if (touch) return;
    const url = new URL(`/${locale}`, window.location.origin);
    url.searchParams.set("ar", flavor);
    QRCode.toString(url.toString(), { type: "svg", margin: 1, color: { dark: "#081d3cff", light: "#ffffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [flavor, locale, touch]);

  // modal behaviour: Esc closes, focus starts on close, page doesn't scroll behind
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const attach = useCallback((el: HTMLElement | null) => {
    viewer.current = el as ModelViewerElement | null;
    if (!el) return;
    // model-viewer fires a CustomEvent named "progress" (not a ProgressEvent)
    el.addEventListener("progress", (e) => setProgress((e as unknown as CustomEvent<{ totalProgress: number }>).detail.totalProgress));
    el.addEventListener("load", () => setCanAR(Boolean((el as ModelViewerElement).canActivateAR)));
  }, []);

  const startAR = () => viewer.current?.activateAR();

  // portal to <body>: the hero is its own stacking context, so the modal would sit under the header
  return createPortal(
    <div
      className="ar-modal fixed inset-0 z-[80] flex items-end justify-center bg-navy-ink/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar-title"
      data-lenis-prevent
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ar-panel relative grid max-h-[100svh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-cream shadow-[0_40px_120px_-30px_rgba(8,29,60,0.8)] sm:rounded-[2.25rem] md:grid-cols-[1.25fr_1fr]">
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-4 z-20 grid size-11 place-items-center rounded-full bg-white text-navy shadow-md transition hover:rotate-90 ltr:right-4 rtl:left-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ---------- 3D viewer ---------- */}
        {/* dir="ltr": model-viewer positions its canvas wrongly inside right-to-left pages */}
        <div dir="ltr" className="ar-stage relative aspect-square min-h-[20rem] md:aspect-auto md:min-h-[34rem]">
          {ready && !failed && (
            <model-viewer
              ref={attach}
              src={modelUrl(flavor)}
              alt={`${t.title} — ${current?.name[locale] ?? ""}`}
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              ar-placement="floor"
              camera-controls=""
              touch-action="pan-y"
              auto-rotate=""
              auto-rotate-delay="800"
              rotation-per-second="18deg"
              interaction-prompt="none"
              camera-orbit="30deg 62deg 125%"
              min-camera-orbit="auto 15deg 55%"
              max-camera-orbit="auto 88deg 180%"
              shadow-intensity="1.1"
              shadow-softness="0.85"
              exposure="1.05"
              environment-image="neutral"
              tone-mapping="aces"
              style={{ width: "100%", height: "100%", background: "transparent" }}
            >
              {/* model-viewer's own AR button is replaced by ours below */}
              <span slot="ar-button" hidden />
            </model-viewer>
          )}

          {(!ready || progress < 1) && !failed && (
            <div className="pointer-events-none absolute inset-x-10 bottom-8 z-10">
              <div className="h-1.5 overflow-hidden rounded-full bg-navy/10">
                <div className="h-full rounded-full bg-orange transition-[width] duration-300" style={{ width: `${Math.max(6, progress * 100)}%` }} />
              </div>
              <p className="mt-2 text-center text-xs font-bold text-navy/50">{t.loading}</p>
            </div>
          )}
          {failed && <p className="absolute inset-0 grid place-items-center p-8 text-center font-bold text-navy/60">{t.failed}</p>}

          {/* stage is dir="ltr", so position explicitly and let the label pick its own direction */}
          <span dir="auto" className={clsx("ar-badge pointer-events-none absolute top-5 z-10", locale === "ar" ? "right-5" : "left-5")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 3 7v10l9 5 9-5V7z" />
              <path d="M3 7l9 5 9-5M12 12v10" />
            </svg>
            {t.realSize}
          </span>
        </div>

        {/* ---------- copy + actions ---------- */}
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="ar-title" className="mt-3 text-balance text-3xl font-black leading-tight text-navy sm:text-4xl">
              {t.title}
            </h2>
            <p className="mt-3 text-navy-ink/65">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.pickFlavor}>
            {flavors.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={f.id === flavor}
                onClick={() => {
                  setFlavor(f.id);
                  setProgress(0);
                }}
                className={clsx(
                  "flex items-center gap-2 rounded-full py-1.5 ps-1.5 pe-3.5 text-sm font-bold transition",
                  f.id === flavor ? "bg-navy text-white shadow-lg shadow-navy/25" : "bg-white text-navy hover:-translate-y-0.5",
                )}
              >
                <span className="size-6 rounded-full ring-2 ring-white" style={{ background: `linear-gradient(140deg, ${f.pack}, ${f.packDeep})` }} />
                {f.name[locale]}
              </button>
            ))}
          </div>

          {touch ? (
            <div className="mt-auto grid gap-3">
              <button type="button" onClick={startAR} disabled={canAR === false || progress < 1} className="ar-cta">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                  <path d="M12 7l5 3v4l-5 3-5-3v-4z" />
                </svg>
                {t.start}
              </button>
              {canAR === false ? (
                <p className="text-center text-sm font-semibold text-navy-ink/55">{t.unsupported}</p>
              ) : (
                <ol className="ar-steps">
                  <li>{t.step1}</li>
                  <li>{t.step2}</li>
                  <li>{t.step3}</li>
                </ol>
              )}
            </div>
          ) : (
            <div className="mt-auto flex items-center gap-5 rounded-3xl bg-white p-4 shadow-[0_20px_50px_-30px_rgba(13,47,94,0.5)]">
              <div className="ar-qr size-32 shrink-0 overflow-hidden rounded-2xl" aria-hidden dangerouslySetInnerHTML={{ __html: qr }} />
              <div>
                <p className="font-black text-navy">{t.scanTitle}</p>
                <p className="mt-1 text-sm text-navy-ink/60">{t.scanBody}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
