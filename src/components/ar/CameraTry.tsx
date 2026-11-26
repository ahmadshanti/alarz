"use client";

/**
 * "Try it with the camera" — works on (almost) any phone or laptop, no AR support needed.
 * The live camera fills the screen; the real-size Charms bar (same GLB as AR) floats on top
 * with a soft contact shadow, so it looks like it's on your table.
 *   one finger  → move it        two fingers → zoom + twist to rotate
 *   shutter     → photo of the table with the ice cream (share / save)
 * Rendering is model-viewer (already loaded by ArViewer); gestures move/scale its element
 * and rotate its camera, so nothing re-renders in React while you drag.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { CharmsFlavor, Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";

type ModelViewerEl = HTMLElement & { toBlob: (o?: { idealAspect?: boolean }) => Promise<Blob> };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function CameraTry({
  locale,
  t,
  flavors,
  flavor,
  onFlavor,
  modelUrl,
  onClose,
}: {
  locale: Locale;
  t: Dictionary["ar"];
  flavors: CharmsFlavor[];
  flavor: string;
  onFlavor: (id: string) => void;
  modelUrl: (id: string) => string;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const viewer = useRef<ModelViewerEl | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [state, setState] = useState<"starting" | "live" | "denied">("starting");
  const [photo, setPhoto] = useState<{ url: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(true);
  // what ONE finger does: spin the bar in 3D (default) or slide it around the table
  const [mode, setMode] = useState<"rotate" | "move">("rotate");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // live transform, kept in a ref and written straight to the DOM (no React re-render per move)
  // yaw = turn around, pitch = tilt (how far above the table we look from)
  const pose = useRef({ x: 0, y: 0, scale: 1, yaw: 25, pitch: 56 });
  const apply = useCallback(() => {
    const { x, y, scale, yaw, pitch } = pose.current;
    if (holder.current) holder.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    viewer.current?.setAttribute("camera-orbit", `${yaw}deg ${pitch}deg 105%`);
  }, []);

  /* ---------- camera ---------- */
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    setState("starting");
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((tr) => tr.stop());
        const v = video.current!;
        v.srcObject = stream;
        await v.play().catch(() => {});
        setState("live");
      } catch {
        if (!cancelled) setState("denied");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [facing]);

  useEffect(() => {
    apply();
    const id = setTimeout(() => setHint(false), 4500);
    return () => clearTimeout(id);
  }, [apply]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (photo ? setPhoto(null) : onClose());
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photo]);

  /* ---------- gestures ----------
     one finger   → spin in 3D (left/right turns it, up/down tilts it) — or slide it, in "move" mode
     two fingers  → slide it (follows the midpoint) + pinch to resize + twist to turn */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    dist: number;
    angle: number;
    mid: { x: number; y: number };
    scale: number;
    yaw: number;
    x: number;
    y: number;
  } | null>(null);

  const twoFinger = () => {
    const [a, b] = [...pointers.current.values()];
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };
  const keepOnScreen = () => {
    const r = stage.current!.getBoundingClientRect();
    pose.current.x = clamp(pose.current.x, -r.width / 2, r.width / 2);
    pose.current.y = clamp(pose.current.y, -r.height / 2, r.height / 2);
  };

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setHint(false);
    if (pointers.current.size === 2) {
      const g = twoFinger();
      const { scale, yaw, x, y } = pose.current;
      gesture.current = { ...g, scale, yaw, x, y };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    const dx = next.x - prev.x,
      dy = next.y - prev.y;
    if (pointers.current.size === 1) {
      if (modeRef.current === "rotate") {
        pose.current.yaw -= dx * 0.6;
        pose.current.pitch = clamp(pose.current.pitch - dy * 0.35, 12, 100);
      } else {
        pose.current.x += dx;
        pose.current.y += dy;
        keepOnScreen();
      }
    } else if (pointers.current.size === 2 && gesture.current) {
      const g = twoFinger();
      const st = gesture.current;
      pose.current.scale = clamp((g.dist / st.dist) * st.scale, 0.35, 3);
      pose.current.yaw = st.yaw - (g.angle - st.angle);
      pose.current.x = st.x + (g.mid.x - st.mid.x);
      pose.current.y = st.y + (g.mid.y - st.mid.y);
      keepOnScreen();
    }
    apply();
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  };
  // mouse wheel = zoom (laptops)
  const onWheel = (e: React.WheelEvent) => {
    pose.current.scale = clamp(pose.current.scale * (e.deltaY < 0 ? 1.08 : 0.93), 0.35, 3);
    apply();
  };

  /* ---------- photo: camera frame + rendered ice cream + small brand mark ---------- */
  const capture = async () => {
    const v = video.current,
      st = stage.current,
      mv = viewer.current;
    if (!v || !st || !mv || busy) return;
    setBusy(true);
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(st.clientWidth * dpr),
        H = Math.round(st.clientHeight * dpr);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d")!;
      // video, object-fit: cover (mirrored for the selfie camera, like the preview)
      const vw = v.videoWidth || W,
        vh = v.videoHeight || H;
      const s = Math.max(W / vw, H / vh);
      g.save();
      if (facing === "user") {
        g.translate(W, 0);
        g.scale(-1, 1);
      }
      g.drawImage(v, (W - vw * s) / 2, (H - vh * s) / 2, vw * s, vh * s);
      g.restore();
      // the ice cream where it sits on screen
      const img = await createImageBitmap(await mv.toBlob({ idealAspect: false }));
      const sr = st.getBoundingClientRect(),
        mr = mv.getBoundingClientRect();
      g.drawImage(img, (mr.left - sr.left) * dpr, (mr.top - sr.top) * dpr, mr.width * dpr, mr.height * dpr);
      // brand mark
      const pad = 18 * dpr;
      g.font = `800 ${15 * dpr}px ${getComputedStyle(document.body).fontFamily}`;
      g.direction = locale === "ar" ? "rtl" : "ltr";
      const label = t.watermark;
      const tw = g.measureText(label).width;
      g.fillStyle = "rgba(8,29,60,0.55)";
      g.beginPath();
      g.roundRect(W - pad - tw - 22 * dpr, H - pad - 32 * dpr, tw + 22 * dpr, 32 * dpr, 16 * dpr);
      g.fill();
      g.fillStyle = "#FEB258";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(label, W - pad - (tw + 22 * dpr) / 2, H - pad - 16 * dpr);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.9));
      if (blob) setPhoto({ url: URL.createObjectURL(blob), blob });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => void (photo && URL.revokeObjectURL(photo.url)), [photo]);

  const share = async () => {
    if (!photo) return;
    const file = new File([photo.blob], "alarz-charms.jpg", { type: "image/jpeg" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: t.watermark });
        return;
      } catch {
        /* cancelled — fall through to download */
      }
    }
    const a = document.createElement("a");
    a.href = photo.url;
    a.download = "alarz-charms.jpg";
    a.click();
  };

  const current = flavors.find((f) => f.id === flavor);

  return (
    <div className="arc" role="dialog" aria-modal="true" aria-label={t.cameraTitle} dir={locale === "ar" ? "rtl" : "ltr"}>
      <video ref={video} className={clsx("arc-video", facing === "user" && "is-mirrored")} playsInline muted autoPlay />

      {/* gesture surface + the ice cream */}
      <div
        ref={stage}
        className="arc-stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
      >
        <div ref={holder} className="arc-model" dir="ltr">
          <model-viewer
            ref={(el: HTMLElement | null) => {
              viewer.current = el as ModelViewerEl | null;
              if (el) apply();
            }}
            src={modelUrl(flavor)}
            alt={current?.name[locale] ?? ""}
            camera-orbit="25deg 56deg 105%"
            interaction-prompt="none"
            disable-zoom=""
            disable-pan=""
            shadow-intensity="1.4"
            shadow-softness="0.55"
            exposure="1.1"
            environment-image="neutral"
            tone-mapping="aces"
            style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}
          />
        </div>
      </div>

      {/* top bar */}
      <div className="arc-top">
        <button type="button" onClick={onClose} className="arc-round" aria-label={t.close}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="arc-title">{t.cameraTitle}</span>
        <button type="button" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className="arc-round" aria-label={t.switchCamera}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7h-3l-2-3H9L7 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" />
            <path d="M9.5 13a3 3 0 0 1 5-2.2M14.5 13a3 3 0 0 1-5 2.2M14.5 9.5v1.5H13M9.5 16.5V15H11" />
          </svg>
        </button>
      </div>

      {state === "live" && hint && <div className="arc-hint">{t.cameraHint}</div>}
      {state === "starting" && <div className="arc-msg">{t.cameraStarting}</div>}
      {state === "denied" && (
        <div className="arc-msg arc-msg--error">
          <p>{t.cameraDenied}</p>
          <button type="button" onClick={onClose} className="arc-pill">
            {t.close}
          </button>
        </div>
      )}

      {/* bottom controls */}
      <div className="arc-bottom">
        <div className="arc-flavors" role="radiogroup" aria-label={t.pickFlavor}>
          {flavors.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={f.id === flavor}
              aria-label={f.name[locale]}
              onClick={() => onFlavor(f.id)}
              className={clsx("arc-flavor", f.id === flavor && "is-on")}
              style={{ background: `linear-gradient(140deg, ${f.pack}, ${f.packDeep})` }}
            />
          ))}
        </div>
        <div className="arc-actions">
          <button
            type="button"
            onClick={() => setMode((m) => (m === "rotate" ? "move" : "rotate"))}
            className="arc-mode"
            aria-label={mode === "rotate" ? t.modeMove : t.modeRotate}
            aria-pressed={mode === "move"}
          >
            {mode === "rotate" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" />
              </svg>
            )}
            <span>{mode === "rotate" ? t.modeRotate : t.modeMove}</span>
          </button>
          <button type="button" onClick={capture} disabled={state !== "live" || busy} className="arc-shutter" aria-label={t.capture}>
            <span />
          </button>
          <button
            type="button"
            onClick={() => {
              pose.current = { x: 0, y: 0, scale: 1, yaw: 25, pitch: 56 };
              apply();
            }}
            className="arc-round"
            aria-label={t.reset}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* photo preview */}
      {photo && (
        <div className="arc-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={t.watermark} />
          <div className="arc-photo__bar">
            <button type="button" onClick={() => setPhoto(null)} className="arc-pill arc-pill--ghost">
              {t.retake}
            </button>
            <button type="button" onClick={share} className="arc-pill">
              {t.share}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
