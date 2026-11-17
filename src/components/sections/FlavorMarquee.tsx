import type { Locale } from "@/content/types";
import SwirlMark from "@/components/ui/SwirlMark";

function Row({ items, reverse, rtl }: { items: string[]; reverse?: boolean; rtl: boolean }) {
  // Two identical halves → seamless loop
  const anim = rtl ? "marquee-rtl" : "marquee";
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex shrink-0 items-center"
        style={{ animation: `${anim} ${items.length * 3.2}s linear infinite ${reverse ? "reverse" : ""}` }}
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
            {items.map((item) => (
              <span key={item} className="flex shrink-0 items-center gap-6 px-6">
                <span>{item}</span>
                <SwirlMark mono className="h-7 w-auto opacity-70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FlavorMarquee({ locale, items }: { locale: Locale; items: string[] }) {
  const rtl = locale === "ar";
  return (
    <section aria-label="flavours" className="relative z-10 -my-6 select-none overflow-x-clip py-6">
      <div className="-mx-[5vw] -rotate-2 bg-orange py-4 text-2xl font-black text-navy shadow-[0_20px_40px_-20px_rgba(242,140,27,0.7)] md:text-4xl">
        <Row items={items} rtl={rtl} />
      </div>
      <div className="-mx-[5vw] mt-[-0.6rem] rotate-1 bg-navy py-3 text-lg font-extrabold text-orange md:text-2xl">
        <Row items={[...items].reverse()} rtl={rtl} reverse />
      </div>
    </section>
  );
}
