// Public storefront: server rendered, so product and category pages are indexable and fast on first load.
export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      // NUXT_PUBLIC_API_BASE_URL / NUXT_PUBLIC_SITE_URL (see .env.example)
      apiBaseUrl: 'http://localhost:8080',
      siteUrl: 'http://localhost:4000',
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon'],
  icon: { serverBundle: 'local', clientBundle: { scan: true }, mode: 'svg' },
  css: ['~/assets/css/main.css'],
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0A0908' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Figtree:wght@400;500;600;700&display=swap' },
      ],
    },
  },
  compatibilityDate: '2025-01-01',
})
