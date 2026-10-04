# Scentology storefront

Public shop for `../ecom-api` (Nuxt 3, **server rendered** for SEO). Tailwind + @nuxt/icon (lucide). Brand: **Scentology — "Scented Your Mood"** (fragrances and menswear: Men → Panjabi, Suits; more categories later): noir bands, metallic gold accent, warm ivory ground. Copy stays category neutral; fragrance-only wording (notes, performance, "scents") shows only for fragrance products (`isFragrance`). Layout inspired by elorvabd.com (dark hero bands, centred logo header, serif display, brand-eyebrow product cards, FAQ, subscribe band).

## Layout

- `app.config.ts` — fallback store name/tagline/description/contact and announcements only; the live values come from `/storefront/info` (`useShop()`: logo, title, meta, footer). Home sections, menu, pages, products and categories come from the API.
- `tailwind.config.js` + `assets/css/main.css` — tokens (`noir-*`, `gold`, `cream`, `ink`) and `s-*` classes (`s-container`, `s-band`, `s-title`, `s-eyebrow`, `s-btn-gold|dark|ghost|line`, `s-chip`, `s-input`, `s-gold-text`). Fonts: Cinzel (wordmark), Cormorant Garamond (display), Figtree (body). Use sans for prices (Cormorant has old-style numerals).
- `composables/useApi.js` — the only fetch client (`api(path, { query })`); base url set by `plugins/api.js`. `useCatalog.js` — categories tree (with `size_chart`), price/discount/image/stock helpers, `money()`, `isFragrance`, `comboLabel`, `sizeChartFor`, `attributeApplies` (attribute `category_ids` scope). `useCart.js` / `useWishlist.js` — bag and saved items in localStorage. `useAuth.js` — customer session (`request()` sends the token; 401 signs out), email code sign-in (`components/auth/EmailSignIn.vue`), `friendly()` error messages.
- `components/layout|home|product|ui/*` — auto-imported as `LayoutSiteHeader`, `HomeHeroSection`, `ProductCard`, `UiSectionHeading`…
- Pages: `/`, `/products` (filters in the query string: `category` (top-level or sub category slug), `sub`, `q`, `min`, `max`, `on_sale`, `brand`, `f.<attr>=a,b`, `opt.<Option>=a,b` → API `options=Option:a,Option:b` one param per option, `sort`, `page`), `/products/[slug]` (Details spec list from visible attributes, fragrance profile only for fragrances, size guide drawer when a Size option + category chart), `/saved`, `/pages/[slug]`; `/checkout` (email code sign-in → address, or store collection with a phone field → pay), `/account`, `/account/orders/[id]`; `/stores` is a placeholder.

## Commands

- `make help` lists everything: `make install`, `make dev`, `make build`, `make start`.
- `npm install`, `npm run dev` → http://localhost:4000 (API on 8080).
- `npm run build` then `node .output/server/index.mjs` (set `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_SITE_URL`, `PORT`).

## Config

`.env` (git ignored; copy `.env.example`): `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_SITE_URL`.

## Shared memory (read this every session)

@.claude/memory/MEMORY.md

Keep it current: non-obvious decisions/gotchas in `.claude/memory/`, one line each in `MEMORY.md`, dated entries in `session-log.md`. Never store secrets.
