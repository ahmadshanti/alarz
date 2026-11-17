/** Melting ice-cream edge used between sections. Colour comes from `currentColor`. */
export default function Drip({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      style={flip ? { transform: "scaleY(-1)" } : undefined}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M0 0h1440v18c-38 0-44 10-52 30-6 16-24 16-28 0-6-22-20-30-56-30-44 0-50 8-60 38-8 26-34 26-38 2-6-30-26-40-74-40-40 0-56 6-62 22-5 14-22 14-25 0-5-18-24-22-60-22-48 0-58 14-66 46-7 28-36 28-40 0-5-34-28-46-84-46-38 0-52 6-58 20-6 13-22 13-26 0-5-16-22-20-58-20-46 0-58 10-66 34-7 22-32 22-36 0-5-26-26-34-72-34-42 0-56 8-62 26-5 15-23 15-27 0-6-18-24-26-64-26-44 0-56 12-64 40-7 26-35 26-40 0-6-30-26-40-72-40-36 0-50 6-56 20-6 14-23 14-27 0-5-14-20-20-50-20-40 0-52 10-60 30-6 18-28 18-32 0-5-22-22-30-58-30z"
      />
    </svg>
  );
}
