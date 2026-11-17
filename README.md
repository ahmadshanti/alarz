# Al-Arz Ice Cream — new website

Rebuild of alarz.ps. Arabic (RTL) first, English second.

## Run

```bash
npm install
npm run dev        # http://localhost:3000  → redirects to /ar
npm run build && npm start
```

Node 20+ is required.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 (brand tokens in `src/app/globals.css`) |
| Animation | GSAP + ScrollTrigger, Lenis smooth scroll |
| 3D | three.js via React Three Fiber + drei |
| Font | Cairo (self-hosted via @fontsource, no Google request) |
| i18n | `/ar` and `/en` routes, dictionaries in `src/i18n` |

## Structure

```
src/
  app/
    [locale]/layout.tsx   html lang/dir, smooth scroll provider
    [locale]/page.tsx     homepage: loads content, renders sections
    api/contact/route.ts  contact form endpoint (validates; CMS hook TODO)
    globals.css           brand colours, buttons, keyframes
  components/
    layout/               Header (sticky glass + mobile menu), Footer
    sections/             Hero, FlavorMarquee, Story, Products, Quality, News, Contact
    three/IceCreamScene   procedural 3D soft-serve (no model files)
    ui/                   SwirlMark (logo mark), Drip (melting edge), ProductArt
    providers/            SmoothScroll (Lenis ↔ GSAP)
  content/                typed static content (mirrors future CMS collections)
  lib/cms.ts              THE ONLY place components get content from
  i18n/                   locales, number/date formatting, UI dictionaries
public/
  logo.svg, favicon.svg   vectorised from the original logo
```

## Brand

- Orange `#FEB258` (deep `#F28C1B`)
- Navy `#194E91` (deep `#0D2F5E`)

## Content notes

- Product names, story, quality facts and news come from the current alarz.ps.
- English product names are provisional transliterations — confirm with the company.
- Product images are tinted SVG placeholders (`ProductArt`) until real photos arrive.
- Facebook / Instagram URLs in `src/content/company.ts` are placeholders.

## Next phase: CMS (Payload)

1. `npx create-payload-app` into this repo (Payload 3 runs inside Next.js), PostgreSQL adapter.
2. Collections matching `src/content/types.ts`: `products`, `categories`, `milestones`,
   `quality-items`, `news`, `messages` (contact form), `media`; global `site-settings`.
   Enable `localization: { locales: ['ar', 'en'], defaultLocale: 'ar' }`.
3. Replace function bodies in `src/lib/cms.ts` with `payload.find(...)` calls.
4. Seed script: import `src/content/*` into the database once.
5. `api/contact/route.ts`: `payload.create({ collection: 'messages', data })` + email.
