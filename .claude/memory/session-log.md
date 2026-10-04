# Session log

## 2026-09-28 — Storefront foundation

- Nuxt 3 SSR app on port 4000: header (mega menu from `/categories/tree`, search, saved, bag), announcement marquee, footer + newsletter band, WhatsApp button; home (hero collage from products, new arrivals, category showcase, best sellers, offer band, promises, FAQ); listing with price/offer/option filters and sort; product page with text/colour/image option pickers, online-stock aware add to bag, related products, JSON-LD; bag drawer; saved items; help pages.
- Re-themed to the Scentology logo (noir + gold). Logo is an SVG approximation (`components/layout/Logo.vue`); swap in the real artwork (`public/logo.png`) when available.
- Next: customer auth (phone OTP), checkout (cart → order → COD/bKash), account, store finder (public locations API).

## 2026-09-28 — Sign-in and checkout

- `useAuth` (token + user in cookies mirrored in `useState`), `AuthPhoneSignIn` (phone → code; shows the dev code in test mode). Checkout: sign in → pick/add address (districts list) → API cart prices delivery → payment method from `/payments/gateways` → order + payment (redirect for online gateways) → `/account/orders/[id]?placed=1`. Account page: profile, orders; order detail with progress.
- Local test customers: 01999000111 … 01999000777 (dev codes, no SMS).

## 2026-09-28 — Return requests

- Account order page: delivered orders show a Returns section (window end date, request form with quantity + reason per item, refund preview, existing returns with status, cancel a pending request). Uses `/returns/returnable`, `/returns`, `/returns/{id}/cancel`. "To pay on delivery" hidden once delivered.

## 2026-09-28 — Coupons, gift cards, store credit at checkout; rewards

- Checkout summary: coupon code (`/coupons/quote` against the API cart, re-quoted when the cart re-prices), gift card code (`/wallet/gift_cards/check`), "use my store credit" (`/wallet/me`); shows discount, wallet parts and "To pay". Order body sends `coupon_code`, `gift_card_code`, `use_store_credit`; when `due_amount` is 0 the payment step is skipped.
- Account page: Rewards card (store credit, points, earn rule, convert points to credit).

## 2026-09-29 — Reports (part 9): nothing changed here

- Reports are admin only (ecom-api `report/`, ecom-admin `/reports`). Cost prices never reach the storefront: product/variant responses only carry `cost_price` for staff tokens.

## 2026-09-29 — Labels and product codes (part 10): nothing changed here

- Variants can now get auto SKUs and in-store EAN-13 barcodes (prefix 200–299) from the API; the storefront shows neither.

## 2026-09-29 — Store finder and click & collect

- `/stores` (real now): stores from `GET /stores`, hours, phone, click & collect badge, Directions (Google Maps), "Nearest to me" (geolocation + `distanceKm`). Product page `ProductStoreStock`: which pickup stores have the chosen variant.
- Checkout: Delivery / Collect from a store (stores shown only if they have the whole bag), no address or delivery fee for pickup (the API cart is made without an address), COD reads "Pay when you collect"; order page shows the pickup store, steps Confirmed → Ready to collect → Collected.

## 2026-09-29 — Transfers (part 12): nothing changed here

- Stock moves between locations in the admin; the storefront's store stock (`/stores?variant_id=`) reflects it.

## 2026-09-29 — Stock counts (part 13): nothing changed here

- Store stock the storefront shows follows counts made in the admin.

## 2026-09-29 — Suppliers and purchase orders (part 14): nothing changed here

- Purchasing is admin only.


## 2026-09-29 — Customer notifications (part 15): nothing changed here

- Emails link to `notifications.storefront_url` + `/account/orders/{id}` (API config), so keep that route stable.

## 2026-09-29 — Brands, attributes, fragrance profile (part 16)

- Cards show the brand above the title. Listing: brand + every filterable attribute as filters with live counts (`/products/facets`), searchable long lists (brands, notes), removable chips, heading follows one or two choices ("Eau de Parfum", "Creed · Eau de Parfum"). URL params `brand=`, `f.<attr>=`, `featured=`.
- Product page: brand • concentration line, limited/featured badges, variant photo + caption per size, About (description + facts), notes pyramid (chips link to `?f.notes=`), performance bars, When to wear (season icons + occasions), More from the brand, related by fragrance family.
- Helpers in `useCatalog.js`: `useAttributes`, `useBrands`, `valueLabel`, `valuesOf`, `eyebrowOf`, `LONGEVITY`/`PROJECTION`.

## 2026-09-29 — Combos and collections (part 17)

- `/combos` (search, gender chips, sort, paged), `/collections/[slug]` (hero with image/subtitle, paged grid), "Combos" in the header. Cards: combos show "Save ৳X" (`comboSaving`) and "Combo · n scents". Product page for a combo: saving vs one by one, What's inside (links to each item).
- `Makefile`: install, dev, build, start, preview, clean, reinstall.

## 2026-09-29 — Mega menus, search overlay, phone menu, brands page (part 18)

- Header reads `/storefront/menu` (`useMenu`): `LayoutMegaMenu` (links with hover arrow, pills, picture cards 3-up or 2×2, top brands grid + Browse all), hover intent (140 ms grace), gold underline for open/current entry, Esc closes, `/` or Cmd+K opens search.
- `LayoutSearchOverlay`: live products (photo, brand, price range), matching brands, recent searches (localStorage), arrow keys + Enter. `LayoutMobileMenu`: drill-down levels, Discover, "New to decants?" → `/pages/decants`.
- `/brands`: A–Z grid with logos, counts, letter filter, top brands.
- Gotcha: puppeteer `clip` screenshots of the mega menu came out stale/faded; take full viewport shots.

## 2026-09-29 — Motion (part 19)

- Lenis smooth scroll (`plugins/lenis.client.js`, off for reduced motion, top on each page); `useScrollLock(ref)` stops it + the page scroll while overlays are open (bag, search, phone menu, filters); scrollable panels carry `data-lenis-prevent`.
- `v-reveal` directive (`plugins/reveal.js`): up/left/right/zoom/fade + delay; items already on screen at load aren't hidden. Used on section headings, product grids (staggered), product page profile, newsletter band.
- `UiCarousel` (scroll snap, arrows, autoplay with filling dot, pauses on hover/focus/touch), `UiLogoMarquee`, `UiPageHero` (orbit rings) on listing/combos/brands/collection pages, shimmer skeletons (`s-shimmer`), page fade transitions, WhatsApp ping.
- Toasts (`useToast` + `UiToaster`): add to bag shows a toast with "View bag" instead of opening the drawer; saving/unsaving shows one too.

## 2026-09-29 — Home page from the builder (part 20)

- `pages/index.vue` renders `/storefront/home` sections with `components/home/*`: Hero (crossfade, Ken Burns, Previous/Next filling line), Split, Brands (logo tiles marquee), Combos (figures + autoplay carousel), Products (5-up grid), Cards (her/him/unisex with a wide last card, 2×2 seasons, 3 styles), Curated (arched picture carousel), Stats (live figures + promise cards), Testimonials (quote + avatar picker with progress), Faq (animated accordion). Old HeroSection/CategoryShowcase/OfferBand/PromiseStrip/FaqSection removed.

## 2026-09-29 — Listing and product page parity, reviews (part 21)

- Listing: quick chips (styles, summer/winter, office/date night; categories first when there are several), two-thumb price slider (`s-range`) + budgets, collapsible `UiFilterGroup`s (first few open, chosen count when closed), sorts Recommended (default) / Top rated, page indicator, sticky scrollable filter panel.
- Product page: `ProductGallery` (hover zoom, full screen viewer with arrows/Esc), stars + review count linking to `#reviews`, "n of this in your bag", phone buy bar once the add row scrolls away, `ProductReviews` (summary bars, paged list, verified badge, shop reply, write form for verified buyers; signed-out → `/account?next=`). Cards show stars. `ProductStars` draws inline SVG stars (lucide stars are outline only).
- Account page honours `?next=` after signing in.

## 2026-09-29 — Contact, content pages, gift box builder (part 22)

- `loadShop()` awaited in app.vue, `useShop()` reads it (`useNuxtData('shop')`): announcement bar, footer (socials, footer pages, payment methods, licence/BIN, hours), WhatsApp. `/pages/[slug]` renders API Markdown (`utils/markdown.js`: raw HTML escaped, unsafe links dropped) with `.s-prose`; `/about`, `/refund-policy`, `/returns`, `/terms`, `/privacy`, `/delivery` redirect there (definePageMeta redirect: routeRules needed a server restart).
- `/contact`: ways to reach us, store cards with OpenStreetMap embeds + directions, the home FAQ, CTA. `/gift-box`: select (search, brand, size, max N) → write the card (live preview) → adds picks + the gift box product to the bag with `cart.giftMessage`; checkout sends `gift_message` (editable there too).
- Gotchas: an un-awaited `useAsyncData` read during SSR gave hydration mismatches; nested `<a>` in `<a>` did too.

## 2026-09-30 — Production CI/CD

- Added `.drone.yml`: push to `main` deploys to 139.162.8.118 (scentology.bd / control.scentology.bd / api.scentology.bd). See deployment.md.
- 2026-09-30: customer sign-in is by **email code** now (was phone SMS): `/auth/otp/request|verify` take `email`; code sent with the mailer (Orb in prod). Staff emails are refused there. Customers found/created by email; phone comes from the delivery address (or the pickup phone field on the storefront).

- 2026-10-05: cart ownership / POS email / customer merge changed nothing here. `POST /orders` now needs the cart to belong to the signed-in customer: checkout already creates/updates its cart with the token, so keep it that way.

## 2026-10-05 — Multi-category (fragrances + menswear)

- Identity from `/storefront/info` (`useShop()`): Logo (monogram ring, no atomiser), app.vue title/meta, home/listing meta. app.config keeps only fallback store details + neutral announcements (dead hero/promises/faq removed).
- Product page: "Details" spec list from every visible attribute with values (notes/season/occasion excluded), fragrance profile only when `isFragrance`/profile data, "About this piece" vs "About the fragrance", related by family else sub category (deduped against "More from"), colour pick swaps to that colour's variant photo even before the size matches, portrait 4:5 gallery (object-contain on cream), `ProductSizeGuide` drawer when an option is named Size and the sub category (else category) has `size_chart` rows.
- Listing: `?category=` accepts a sub category slug (parent becomes the category); quick chips from live facet counts (attributes scoped to the category first, ≤6, values that narrow the results); option filters send `options=Size:M,Size:L&options=Colour:Navy`.
- Copy neutralised (search, phone menu promo → New in, reviews reply uses shop name, combos "Combos & sets", brands "Brands & labels", gift box "gifts", stores/contact, return reasons). Cards: `comboLabel`, colour dots.
- 2026-10-05: header nav needs xl width when the menu has more than 5 top-level entries (one per category); otherwise it ran into the centred logo.

## 2026-10-05 — Hero carousel, split, big screens

- `HomeHero` rebuilt for deals: picture/mobile picture (`<picture>`), wash by align/theme, badge + countdown, two buttons, picture-only slides, labelled tab strip with fill (below the picture on phones), swipe, arrow keys, pauses on hover/focus/hidden tab/reduced motion.
- `HomeSplit`: picture in a rounded 4:5 frame (4:3 on phones) inside the container, `focus` + `image_left`.
- Big screens: root font-size grows from 1600px wide (to 24px max), so rem layouts scale instead of leaving a narrow column.
- Listing quick chips only offer values present on the listed products.
