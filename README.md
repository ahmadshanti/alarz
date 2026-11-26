# Al-Arz Ice Cream — new website

Rebuild of alarz.ps. Arabic (RTL) first, English second.
Content is managed by the company from **/admin** (Payload CMS + Neon Postgres).

## Setup

Node 20.9+ is required.

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # http://localhost:3000 → /ar   ·   admin: http://localhost:3000/admin
```

`.env`:

| Variable | What |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (`...?sslmode=require`) |
| `PAYLOAD_SECRET` | long random string — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SERVER_URL` | public URL of the site, e.g. `http://localhost:3000` |

First run with a fresh database:

1. `npm run dev` — in development Payload creates the tables automatically.
2. `npm run seed` — imports everything in `src/content` (products, categories, story,
   quality, news, Charms flavours, site settings) in Arabic and English.
   It skips if products already exist; `npm run seed -- --force` wipes the content
   collections and re-imports (users, media and messages are never touched).
3. Open `/admin` and create the first user — the first account ever created is an **admin**.

Without `DATABASE_URL` the site still runs, using the static content in `src/content`.

### Scripts

| Script | |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `seed` | import `src/content` into the database |
| `generate:types` | regenerate `src/payload-types.ts` after changing collections |
| `generate:importmap` | regenerate the admin import map after adding admin components |
| `payload` | Payload CLI (`npm run payload -- migrate:create`, …) |

## How content flows

- Components read content **only** through `src/lib/cms.ts`. It queries Payload's Local API
  (`locale: "all"` → `{ ar, en }`) and falls back to `src/content` when there is no database,
  the database is empty, or a query fails — so the site never breaks because of the CMS.
- Saving anything in the admin triggers `revalidatePath("/ar")` and `("/en")`, so changes
  appear immediately (`src/payload/hooks/revalidate.ts`). Pages also revalidate hourly.
- The contact form posts to `/api/contact`, which validates and saves to **Messages**.
  The public REST API cannot create messages (`create: () => false`).

### Admin roles

- **Admin** — everything, including users and roles.
- **Editor** — content only; can see and edit only their own user account.

### Collections & globals

`products`, `categories`, `news`, `milestones`, `quality-items`, `media`, `messages`, `users`;
globals `homepage` (Charms flavours for the 3D hero and the "rank them" section) and
`site-settings` (phones, emails, address, social links, founded year, capacity).
Product photos and news covers are optional — without them the illustrated placeholders are used.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| CMS | Payload 3 (admin at `/admin`, REST at `/api/*`), Postgres on Neon |
| Styling | Tailwind CSS 4 (brand tokens in `src/app/(frontend)/globals.css`) |
| Animation | GSAP + ScrollTrigger, Lenis smooth scroll |
| 3D | three.js via React Three Fiber + drei |
| Font | Cairo (self-hosted via @fontsource, no Google request) |
| i18n | `/ar` and `/en` routes, dictionaries in `src/i18n`; CMS localization ar (default) + en |

## Structure

```
src/
  app/
    (frontend)/
      [locale]/layout.tsx   html lang/dir, smooth scroll provider
      [locale]/page.tsx     homepage: loads content, renders sections
      api/contact/route.ts  contact form → messages collection
      globals.css           brand colours, buttons, keyframes
    (payload)/              Payload admin + REST API (from the Payload blank template)
  payload.config.ts         Payload config (db, localization, admin branding)
  payload/
    collections/            Users, Media, Categories, Products, Milestones, QualityItems, News, Messages
    globals/                Homepage, SiteSettings
    hooks/revalidate.ts     re-render /ar and /en after changes
    access.ts               access rules (public read, logged-in edit, admin-only)
  payload-types.ts          generated types (npm run generate:types)
  seed/index.ts             imports src/content into the database
  components/               UI sections (unchanged by the CMS work)
  content/                  static content: seed source + fallback
  lib/cms.ts                THE ONLY place components get content from
  i18n/                     locales, number/date formatting, UI dictionaries
public/
  logo.svg, favicon.svg     vectorised from the original logo
```

## Interactive features

### Ask Al-Arz (AI assistant)
- Floating button on every page; chat streams from `/api/assistant` (Google Gemini, Interactions API, free tier; model `gemini-3.5-flash-lite` (minimal thinking, ~1-3 s replies) with automatic fallback to `gemini-3.1-flash-lite` when busy or out of quota — override with `GEMINI_MODEL`). Gemini keeps the conversation (`previous_interaction_id`); the browser only holds the last interaction id.
- Tools (`src/lib/assistant/tools.ts`, provider-independent) run on our server: `show_products` (catalogue cards), `find_nearest_stores` (shared location or a named town/landmark — see `src/lib/assistant/places.ts`), `submit_distributor_request` (saves to **Messages** after the visitor confirms).
- Knowledge comes from the CMS (`src/lib/assistant/knowledge.ts`), so edits in /admin reach the assistant within 5 minutes.
- Needs `GEMINI_API_KEY` (free from aistudio.google.com/apikey) locally in `.env` and in Vercel → Settings → Environment Variables, then redeploy. On the free tier Google may use the conversations to improve its products and applies daily limits; a paid key removes both.
- Best-effort rate limits per IP: 20 messages / 10 min, 3 distributor requests / hour.

### Ice cream on your table (AR)
- Button under the 3D hero. Uses Google's `<model-viewer>` (vendored in `public/vendor`, loaded only when opened): Android Scene Viewer / WebXR, iPhone Quick Look. Computers get a QR code that opens it on the phone (`/ar?ar=<flavor>`).
- Models: `public/models/charms-<flavor>.glb`, real size, built from the same procedural model as the hero (`src/components/three/charmsArModel.ts`). Re-export them if the bar's shape or flavours change.

### Where to buy (map)
- `/ar/stores`: MapLibre + free OpenFreeMap tiles, clustered points, nearest list, directions.
- Points of sale live in the **Points of sale** collection. `npm run stores:import` adds new food shops from OpenStreetMap (West Bank + Gaza); edited or hidden points are never touched.

## Before production

1. **Migrations instead of auto-push.** In development Payload pushes schema changes
   directly. For production, create migrations and run them on deploy:
   ```bash
   npm run payload -- migrate:create initial
   npm run payload -- migrate          # run in CI / before `next start`
   ```
   Commit the generated `src/migrations` folder.
2. **Uploads.** Images uploaded in the admin are saved to `public/media` and committed with
   the code, so each deploy ships them and they are served as static files (`/media/<file>`).
   Workflow: upload/replace images in the **local** admin, then commit and push.
   Uploads made from the admin on Vercel are not kept (its disk is temporary). If the company
   needs to upload directly on the live site, add a storage adapter such as
   `@payloadcms/storage-vercel-blob` or `@payloadcms/storage-s3`.
3. **Email adapter.** To email the sales team about new contact messages (and for
   password-reset emails), add `@payloadcms/email-nodemailer` or `@payloadcms/email-resend`,
   then send to `site-settings.notifyEmail` from `src/app/(frontend)/api/contact/route.ts`.
4. Set a strong `PAYLOAD_SECRET` and the real `NEXT_PUBLIC_SERVER_URL` on the host.

## Brand

- Orange `#FEB258` (deep `#F28C1B`)
- Navy `#194E91` (deep `#0D2F5E`)

## Content notes

- Product names, story, quality facts and news come from the current alarz.ps.
- English product names are provisional transliterations — confirm with the company.
- Product images are tinted SVG placeholders (`ProductArt`) until real photos are uploaded.
- Facebook / Instagram URLs are placeholders — update them in **Site settings**.
