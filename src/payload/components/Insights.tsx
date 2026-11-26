/**
 * Dashboard insights for the company (top of /admin): what needs attention today and how the
 * site is doing — new messages, distributor leads, catalogue and points-of-sale coverage,
 * and a 14-day chart of incoming messages. Server component: queries run on the server.
 */
import type { ServerProps } from "payload";

const DAY = 24 * 60 * 60 * 1000;
/** Days are counted on Palestine time, not UTC (a message at 00:30 belongs to "today"). */
const TZ = "Asia/Hebron";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export async function Insights({ payload, i18n }: ServerProps) {
  const ar = i18n.language === "ar";
  const since30 = new Date(Date.now() - 30 * DAY).toISOString();
  const since14 = new Date(Date.now() - 14 * DAY); // a little extra; bucketing below trims to 14 local days

  const [newMsgs, leads30, msgs30, products, stores, supermarkets, minimarkets, malls, recent] = await Promise.all([
    payload.count({ collection: "messages", where: { status: { equals: "new" } } }),
    payload.count({ collection: "messages", where: { and: [{ type: { equals: "distributor" } }, { createdAt: { greater_than: since30 } }] } }),
    payload.count({ collection: "messages", where: { createdAt: { greater_than: since30 } } }),
    payload.count({ collection: "products", where: { published: { equals: true } } }),
    payload.count({ collection: "points-of-sale", where: { active: { equals: true } } }),
    payload.count({ collection: "points-of-sale", where: { and: [{ active: { equals: true } }, { type: { equals: "supermarket" } }] } }),
    payload.count({ collection: "points-of-sale", where: { and: [{ active: { equals: true } }, { type: { equals: "minimarket" } }] } }),
    payload.count({ collection: "points-of-sale", where: { and: [{ active: { equals: true } }, { type: { equals: "mall" } }] } }),
    payload.find({
      collection: "messages",
      where: { createdAt: { greater_than: since14.toISOString() } },
      limit: 1000,
      depth: 0,
      pagination: false,
      select: { createdAt: true, type: true },
    }),
  ]);

  // messages per day, last 14 days
  const now = Date.now();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY);
    return { key: dayKey.format(d), date: d, total: 0, leads: 0 };
  });
  for (const m of recent.docs as Array<{ createdAt: string; type?: string | null }>) {
    const key = dayKey.format(new Date(m.createdAt));
    const day = days.find((d) => d.key === key);
    if (day) {
      day.total++;
      if (m.type === "distributor") day.leads++;
    }
  }
  const max = Math.max(1, ...days.map((d) => d.total));
  const fmt = new Intl.NumberFormat(ar ? "ar-EG" : "en-US");
  const dayFmt = new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short", timeZone: TZ });

  const cards = [
    {
      label: ar ? "رسائل جديدة بانتظار الرد" : "New messages waiting",
      value: newMsgs.totalDocs,
      href: "/admin/collections/messages?where[status][equals]=new",
      tone: newMsgs.totalDocs > 0 ? "alert" : "calm",
    },
    {
      label: ar ? "طلبات توزيع (آخر ٣٠ يوم)" : "Distributor requests (30 days)",
      value: leads30.totalDocs,
      href: "/admin/collections/messages?where[type][equals]=distributor",
      tone: "brand",
    },
    { label: ar ? "كل الرسائل (آخر ٣٠ يوم)" : "All messages (30 days)", value: msgs30.totalDocs, href: "/admin/collections/messages", tone: "calm" },
    { label: ar ? "منتجات منشورة" : "Published products", value: products.totalDocs, href: "/admin/collections/products", tone: "calm" },
    { label: ar ? "نقاط بيع على الخريطة" : "Points of sale on the map", value: stores.totalDocs, href: "/admin/collections/points-of-sale", tone: "calm" },
  ] as const;

  const mix = [
    { label: ar ? "سوبر ماركت" : "Supermarkets", value: supermarkets.totalDocs, color: "#194E91" },
    { label: ar ? "ميني ماركت" : "Minimarkets", value: minimarkets.totalDocs, color: "#F28C1B" },
    { label: ar ? "مولات" : "Malls", value: malls.totalDocs, color: "#0E8C7A" },
  ];
  const mixTotal = Math.max(1, mix.reduce((a, b) => a + b.value, 0));

  return (
    <section className="alarz-insights" aria-label={ar ? "مؤشرات الموقع" : "Site insights"}>
      <div className="alarz-insights__head">
        <h2>{ar ? "أهلين 👋 هذا ملخّص اليوم" : "Hi 👋 here's today at a glance"}</h2>
        <a href={ar ? "/ar" : "/en"} target="_blank" rel="noreferrer">
          {ar ? "افتح الموقع ↗" : "Open the site ↗"}
        </a>
      </div>

      <div className="alarz-insights__cards">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className={`alarz-card alarz-card--${c.tone}`}>
            <span className="alarz-card__value">{fmt.format(c.value)}</span>
            <span className="alarz-card__label">{c.label}</span>
          </a>
        ))}
      </div>

      <div className="alarz-insights__row">
        <div className="alarz-panel">
          <h3>{ar ? "الرسائل آخر ١٤ يوم" : "Messages, last 14 days"}</h3>
          <div className="alarz-bars" role="img" aria-label={ar ? "رسم بياني للرسائل اليومية" : "Daily messages chart"}>
            {days.map((d) => (
              <div key={d.key} className="alarz-bar" title={`${dayFmt.format(d.date)}: ${d.total}`}>
                <span className="alarz-bar__n">{d.total ? fmt.format(d.total) : ""}</span>
                <span className="alarz-bar__col" style={{ height: `${(d.total / max) * 100}%` }}>
                  <span className="alarz-bar__leads" style={{ height: d.total ? `${(d.leads / d.total) * 100}%` : 0 }} />
                </span>
                <span className="alarz-bar__day">{dayFmt.format(d.date)}</span>
              </div>
            ))}
          </div>
          <p className="alarz-legend">
            <i style={{ background: "#FEB258" }} /> {ar ? "طلبات توزيع" : "Distributor requests"}
            <i style={{ background: "#194E91" }} /> {ar ? "رسائل أخرى" : "Other messages"}
          </p>
        </div>

        <div className="alarz-panel">
          <h3>{ar ? "توزيع نقاط البيع" : "Points of sale by type"}</h3>
          <div className="alarz-mix">
            {mix.map((m) => (
              <span key={m.label} style={{ width: `${(m.value / mixTotal) * 100}%`, background: m.color }} />
            ))}
          </div>
          <ul className="alarz-mix__list">
            {mix.map((m) => (
              <li key={m.label}>
                <i style={{ background: m.color }} />
                <span>{m.label}</span>
                <b>{fmt.format(m.value)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
