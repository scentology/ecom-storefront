# Gotchas

- **Nuxt context in async code**: `useRuntimeConfig()` / `useAppConfig()` fail inside async data handlers after an `await` and inside `useSeoMeta` getters. The API base url is set once by `plugins/api.js`; read app config at setup time and pass values into getters.
- **New `plugins/` dir or Tailwind token renames need a dev server restart** (otherwise SSR fetches go to Nuxt itself, or `@apply` says a class doesn't exist).
- **Stock**: sell against `variant.online_stock` (stock at locations that sell online), never `stock` (all locations).
- **Separate `useCookie()` refs don't sync**: `useAuth` mirrors the cookies in `useState` so a sign-in in one component shows everywhere.
- **Bag-dependent pages** (checkout) render inside `<ClientOnly>`: the bag lives in localStorage, so SSR output would never match.
- **Overlays must use `useScrollLock`**: Lenis keeps scrolling the page under a fixed overlay otherwise; inner scroll areas need `data-lenis-prevent`.
- **`v-reveal` hides only below-the-fold elements at mount**; SSR renders everything visible, so content never depends on JS to appear.
- **Never nest links** (`<a>` inside `<a>`/NuxtLink): the browser splits them and hydration breaks for the whole page.
- **Shared data every page needs (shop details) is fetched once in app.vue with `await`**; composables read it with `useNuxtData` so server and client render the same.
- Drone pipes the step script into sh on stdin, so every remote `ssh` step must be `ssh -n`; a plain ssh swallows the rest of the script and a later line runs truncated (`usage: ssh ...`, exit 255).
- **Customers sign in by email, not phone** (2026-09-30): the account has no phone. Orders still need `customer_phone`: delivery takes it from the address, store collection from the pickup phone field.

- Headless Chrome can't size a window under ~500px: phone screenshots need CDP `Emulation.setDeviceMetricsOverride` (a 390px `--window-size` silently renders wider and looks like overflow).
