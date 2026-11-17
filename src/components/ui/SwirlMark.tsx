import { SWIRL_PATHS, SWIRL_VIEWBOX } from "./swirlPaths";

/** The cedar / soft-serve swirl from the Al-Arz logo, as inline SVG. */
export default function SwirlMark({
  className,
  mono,
}: {
  className?: string;
  /** Render in a single colour (uses currentColor) */
  mono?: boolean;
}) {
  return (
    <svg viewBox={SWIRL_VIEWBOX} className={className} aria-hidden>
      {SWIRL_PATHS.map((p, i) => (
        <path key={i} d={p.d} fill={mono ? "currentColor" : p.fill} fillRule="evenodd" />
      ))}
    </svg>
  );
}
