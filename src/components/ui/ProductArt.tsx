import type { CategoryId, FlavorColors } from "@/content/types";

/**
 * Placeholder product illustration, tinted per flavour.
 * Replace with real product photos once they are uploaded to the CMS.
 */
export default function ProductArt({
  category,
  colors,
  id,
  className,
}: {
  category: CategoryId;
  colors: FlavorColors;
  id: string;
  className?: string;
}) {
  const g = `g-${id}`;
  const shine = `s-${id}`;
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden>
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="30%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.accent} />
        </radialGradient>
        <linearGradient id={shine} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {category === "single" && (
        <g>
          {/* stick */}
          <rect x="91" y="150" width="18" height="58" rx="9" fill="#E8C08A" />
          {/* bar */}
          <rect x="52" y="22" width="96" height="140" rx="46" fill={`url(#${g})`} />
          {/* dip coating */}
          <path d="M52 70 Q52 22 100 22 Q148 22 148 70 L148 82 Q138 96 128 84 Q118 104 106 86 Q96 100 86 84 Q74 100 66 86 Q58 96 52 84Z" fill={colors.accent} opacity="0.9" />
          <rect x="66" y="40" width="14" height="90" rx="7" fill={`url(#${shine})`} />
        </g>
      )}

      {category === "family" && (
        <g>
          {/* scoop on top */}
          <circle cx="100" cy="70" r="44" fill={`url(#${g})`} />
          <circle cx="70" cy="86" r="26" fill={`url(#${g})`} />
          <circle cx="132" cy="88" r="24" fill={`url(#${g})`} />
          {/* tub */}
          <path d="M34 96 H166 L152 200 Q151 208 142 208 H58 Q49 208 48 200Z" fill="#ffffff" />
          <path d="M40 140 H160 L156 170 H44Z" fill={colors.accent} />
          <path d="M28 92 H172 Q176 92 176 98 V104 Q176 110 170 110 H30 Q24 110 24 104 V98 Q24 92 28 92Z" fill="#194E91" />
          <rect x="58" y="116" width="8" height="84" rx="4" fill="#000" opacity="0.05" />
        </g>
      )}

      {category === "occasion" && (
        <g>
          <circle cx="78" cy="58" r="34" fill={`url(#${g})`} />
          <circle cx="122" cy="58" r="34" fill="url(#g-occ-2)" />
          <defs>
            <radialGradient id="g-occ-2" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#7A4529" />
              <stop offset="100%" stopColor="#3B1E10" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="40" r="30" fill="#F58AA2" />
          <path d="M22 78 H178 L164 204 Q163 212 154 212 H46 Q37 212 36 204Z" fill="#ffffff" />
          <path d="M30 120 H170 L165 168 H35Z" fill="#FEB258" />
          <path d="M16 72 H184 Q190 72 190 78 V88 Q190 94 184 94 H16 Q10 94 10 88 V78 Q10 72 16 72Z" fill="#194E91" />
          <text x="100" y="152" textAnchor="middle" fontSize="26" fontWeight="900" fill="#194E91">4.5L</text>
        </g>
      )}
    </svg>
  );
}
