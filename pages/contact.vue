<script setup>
// Contact: ways to reach us, every store with its hours and a map, questions, and a nudge to the shop.
const shop = useShop()
useSeoMeta({ title: 'Contact us', description: 'Call, message or visit us: our stores, opening hours and directions.' })
const { data: stores } = await useAsyncData('contact-stores', () => api('/stores').then((r) => r.data || []).catch(() => []), { default: () => [] })
const { data: home } = await useAsyncData('contact-faq', () => api('/storefront/home').then((r) => r.data).catch(() => null), { default: () => null })
const faq = computed(() => home.value?.sections?.find((s) => s.type === 'faq'))
const tel = (p) => `tel:${String(p || '').replace(/[^+\d]/g, '')}`
const localPhone = (p) => (p && p.startsWith('880') ? `0${p.slice(3)}` : p || '')
const map = (s) => {
  const d = 0.006
  return `https://www.openstreetmap.org/export/embed.html?bbox=${s.longitude - d},${s.latitude - d},${s.longitude + d},${s.latitude + d}&layer=mapnik&marker=${s.latitude},${s.longitude}`
}
const directions = (s) => (s.latitude != null ? `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}` : `https://www.google.com/maps/search/${encodeURIComponent(s.address)}`)
const SOCIAL = { facebook: 'lucide:facebook', instagram: 'lucide:instagram', youtube: 'lucide:youtube', tiktok: 'lucide:music-2', x: 'lucide:twitter', linkedin: 'lucide:linkedin' }
</script>

<template>
  <div>
    <UiPageHero eyebrow="We're here" title="Get in touch" note="Questions about a product, a size, an order or a gift? Ask us." />

    <section class="s-container py-16">
      <h2 v-reveal class="s-title text-3xl text-noir-800 text-center">How can we help?</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        <div v-reveal="{ dir: 'up', delay: 0 }" class="rounded-2xl bg-white ring-1 ring-line p-6 hover:shadow-lift transition">
          <span class="w-11 h-11 rounded-full bg-noir-900 text-gold-light flex items-center justify-center"><Icon name="lucide:phone" class="w-5 h-5" /></span>
          <p class="font-display text-xl text-noir-800 mt-4">Phone &amp; WhatsApp</p>
          <a :href="tel(shop.phone)" class="block text-sm text-ink-soft mt-1 hover:text-noir-800">{{ shop.phone }}</a>
          <a v-if="shop.whatsapp" :href="`https://wa.me/${shop.whatsapp}`" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-sm font-semibold text-green-700 mt-3">Message on WhatsApp <Icon name="lucide:arrow-up-right" class="w-4 h-4" /></a>
        </div>
        <a v-reveal="{ dir: 'up', delay: 80 }" :href="`mailto:${shop.email}`" class="rounded-2xl bg-white ring-1 ring-line p-6 hover:shadow-lift transition">
          <span class="w-11 h-11 rounded-full bg-noir-900 text-gold-light flex items-center justify-center"><Icon name="lucide:mail" class="w-5 h-5" /></span>
          <p class="font-display text-xl text-noir-800 mt-4">Email</p><p class="text-sm text-ink-soft mt-1 break-all">{{ shop.email }}</p><p class="text-xs text-ink-faint mt-3">We answer within a day</p>
        </a>
        <NuxtLink v-reveal="{ dir: 'up', delay: 160 }" to="/stores" class="rounded-2xl bg-white ring-1 ring-line p-6 hover:shadow-lift transition">
          <span class="w-11 h-11 rounded-full bg-noir-900 text-gold-light flex items-center justify-center"><Icon name="lucide:map-pin" class="w-5 h-5" /></span>
          <p class="font-display text-xl text-noir-800 mt-4">Visit a store</p><p class="text-sm text-ink-soft mt-1">{{ stores.length }} {{ stores.length === 1 ? 'store' : 'stores' }}: try before you buy</p>
        </NuxtLink>
        <div v-reveal="{ dir: 'up', delay: 240 }" class="rounded-2xl bg-white ring-1 ring-line p-6">
          <span class="w-11 h-11 rounded-full bg-noir-900 text-gold-light flex items-center justify-center"><Icon name="lucide:clock" class="w-5 h-5" /></span>
          <p class="font-display text-xl text-noir-800 mt-4">Hours</p><p class="text-sm text-ink-soft mt-1">{{ shop.hours || 'Every day' }}</p>
        </div>
      </div>
      <div v-if="Object.values(shop.social || {}).some(Boolean)" class="flex items-center justify-center gap-3 mt-10">
        <span class="text-sm text-ink-soft mr-1">Follow us</span>
        <template v-for="(icon, key) in SOCIAL" :key="key">
          <a v-if="shop.social[key]" :href="shop.social[key]" target="_blank" rel="noopener" class="w-10 h-10 rounded-full ring-1 ring-line-strong flex items-center justify-center hover:bg-noir-900 hover:text-gold-light transition" :aria-label="key"><Icon :name="icon" class="w-4 h-4" /></a>
        </template>
      </div>
    </section>

    <section v-if="stores.length" class="bg-cream-deep/60 py-16">
      <div class="s-container">
        <h2 v-reveal class="s-title text-3xl text-noir-800">Our stores</h2>
        <div class="grid lg:grid-cols-2 gap-6 mt-8">
          <article v-for="(s, i) in stores" :key="s._id" v-reveal="{ dir: i % 2 ? 'right' : 'left' }" class="rounded-3xl bg-white ring-1 ring-line overflow-hidden grid sm:grid-cols-2">
            <div class="p-6 flex flex-col">
              <h3 class="font-display text-2xl text-noir-800">{{ s.name }}</h3>
              <p class="text-sm text-ink-soft mt-2">{{ s.address }}</p>
              <p v-if="s.hours" class="text-sm text-ink-soft mt-2 flex items-center gap-2"><Icon name="lucide:clock" class="w-4 h-4" />{{ s.hours }}</p>
              <p v-if="s.phone" class="text-sm mt-2"><a :href="tel(s.phone)" class="text-noir-800 hover:underline">{{ localPhone(s.phone) }}</a></p>
              <p v-if="s.pickup" class="text-xs text-green-700 mt-3 flex items-center gap-1"><Icon name="lucide:package-check" class="w-4 h-4" /> Click &amp; collect here</p>
              <a :href="directions(s)" target="_blank" rel="noopener" class="s-btn-dark !py-2 !px-4 mt-auto pt-2 self-start text-sm">Directions <Icon name="lucide:navigation" class="w-4 h-4" /></a>
            </div>
            <div class="min-h-[14rem] bg-cream-deep">
              <iframe v-if="s.latitude != null" :src="map(s)" :title="`Map of ${s.name}`" class="w-full h-full min-h-[14rem] border-0" loading="lazy" referrerpolicy="no-referrer" />
              <div v-else class="w-full h-full flex items-center justify-center text-ink-faint"><Icon name="lucide:map" class="w-8 h-8" /></div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <HomeFaq v-if="faq" :section="faq" />

    <section class="s-container pb-20">
      <div v-reveal="'zoom'" class="s-band rounded-3xl text-center px-6 py-14">
        <h2 class="s-title text-3xl sm:text-4xl">Ready to find <em class="font-display italic s-gold-text">your signature look?</em></h2>
        <div class="flex flex-wrap justify-center gap-3 mt-8">
          <NuxtLink to="/products" class="s-btn-gold">Shop now</NuxtLink>
          <NuxtLink to="/combos" class="s-btn border border-white/30 text-cream hover:border-gold hover:text-gold">See the combos</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
