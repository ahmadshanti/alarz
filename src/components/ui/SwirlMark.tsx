import { SWIRL_PATHS, SWIRL_VIEWBOX } from "./swirlPaths";

const [, , VB_W, VB_H] = SWIRL_VIEWBOX.split(" ").map(Number);

/**
 * The cedar / soft-serve swirl from the Al-Arz logo.
 *
 * `mono` (every current use): an element masked with /swirl-mark.svg and painted with
 * `currentColor`. The 14 KB of path data is downloaded once and cached, instead of being
 * repeated in the HTML for every copy (the flavour marquee alone shows ~40 of them).
 * Size it like an image: set a height (or a width) and the other side follows the logo's ratio.
 */
export default function SwirlMark({
  className,
  mono,
}: {
  className?: string;
  /** Render in a single colour (uses currentColor) */
  mono?: boolean;
}) {
  if (mono) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 bg-current ${className ?? ""}`}
        style={{
          aspectRatio: `${VB_W} / ${VB_H}`,
          WebkitMaskImage: "url(/swirl-mark.svg)",
          maskImage: "url(/swirl-mark.svg)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }
  return (
    <svg viewBox={SWIRL_VIEWBOX} className={className} aria-hidden>
      {SWIRL_PATHS.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} fillRule="evenodd" />
      ))}
    </svg>
  );
}
