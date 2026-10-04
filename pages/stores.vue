<script setup>
// Store finder: every store with hours, phone and directions; nearest first once the shopper shares a location.
useSeoMeta({ title: 'Our stores', description: 'Visit us, try before you buy, or collect your online order.' })
const { data } = await useAsyncData('stores', () => api('/stores').then((r) => r.data || []).catch(() => []))
const stores = computed(() => data.value || [])
const here = ref(null)
const locating = ref(false)
const locError = ref('')
const locate = () => {
  if (!navigator.geolocation) { locError.value = 'Your browser can’t share a location.'; return }
  locating.value = true; locError.value = ''
  navigator.geolocation.getCurrentPosition(
    (p) => { here.value = { lat: p.coords.latitude, lng: p.coords.longitude }; locating.value = false },
    () => { locError.value = 'We couldn’t get your location.'; locating.value = false },
    { timeout: 10000 },
  )
}
const withDistance = computed(() => stores.value
  .map((s) => ({ ...s, km: here.value && s.latitude != null ? distanceKm(here.value, { lat: s.latitude, lng: s.longitude }) : null }))
  .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9)))
const localPhone = (p) => (p && p.startsWith('880') ? `0${p.slice(3)}` : p || '')
</script>

<template>
  <section class="s-container py-14">
    <p class="s-eyebrow text-gold-deep text-center">Visit us</p>
    <h1 class="s-title text-4xl sm:text-5xl text-noir-900 text-center mt-3">Our stores</h1>
    <p class="text-ink-soft text-center mt-3 max-w-xl mx-auto">Try before you buy, from fragrances to fittings, or order online and collect it from the store that suits you.</p>
    <div class="text-center mt-6">
      <button class="s-btn-line" :disabled="locating" @click="locate"><Icon name="lucide:locate-fixed" class="w-4 h-4" /> {{ locating ? 'Finding you…' : 'Nearest to me' }}</button>
      <p v-if="locError" class="text-sm text-sale mt-2">{{ locError }}</p>
    </div>

    <p v-if="!stores.length" class="text-center text-ink-soft py-16">Our stores are opening soon.</p>
    <ul v-else class="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <li v-for="s in withDistance" :key="s._id" class="rounded-2xl bg-white ring-1 ring-line p-6 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <h2 class="font-display text-2xl">{{ s.name }}</h2>
          <span v-if="s.km != null" class="text-sm text-ink-soft tabular-nums whitespace-nowrap">{{ s.km < 10 ? s.km.toFixed(1) : Math.round(s.km) }} km</span>
        </div>
        <p v-if="s.address" class="text-ink-soft mt-2">{{ s.address }}</p>
        <ul class="mt-4 space-y-1.5 text-sm">
          <li v-if="s.hours" class="flex gap-2"><Icon name="lucide:clock" class="w-4 h-4 mt-0.5 text-gold-deep" /> {{ s.hours }}</li>
          <li v-if="s.phone" class="flex gap-2"><Icon name="lucide:phone" class="w-4 h-4 mt-0.5 text-gold-deep" /> <a :href="`tel:${localPhone(s.phone)}`" class="underline">{{ localPhone(s.phone) }}</a></li>
          <li v-if="s.pickup" class="flex gap-2"><Icon name="lucide:shopping-bag" class="w-4 h-4 mt-0.5 text-gold-deep" /> Click & collect: order online, pick up here</li>
        </ul>
        <a :href="mapsLink(s)" target="_blank" rel="noopener" class="s-btn-dark mt-6 self-start"><Icon name="lucide:navigation" class="w-4 h-4" /> Directions</a>
      </li>
    </ul>
  </section>
</template>
