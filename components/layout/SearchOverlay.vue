<script setup>
// Full width search: live results with photo, brand and price range; matching brands; recent searches.
const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const { data: brands } = await useBrands()
const { data: categories } = await useCategories()
// "Try" suggestions: the sub categories first (Panjabi, Suits…), then a mix of occasions, notes and brands
const TRY = ['Panjabi', 'Eid', 'Suits', 'Oud', 'Linen', 'Dior']
const suggestions = computed(() => [...categories.value.flatMap((c) => c.children.map((s) => s.name)), ...TRY]
  .filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i).slice(0, 6))
useScrollLock(computed(() => props.open))
const q = ref('')
const input = ref(null)
const results = ref([])
const total = ref(0)
const loading = ref(false)
const active = ref(-1)
const RECENT = 'scentology_recent_searches'
const recent = ref([])

watch(() => props.open, (v) => {
  if (!v) return
  try { recent.value = JSON.parse(localStorage.getItem(RECENT) || '[]') } catch { recent.value = [] }
  active.value = -1
  nextTick(() => input.value?.focus())
})
let timer, seq = 0
watch(q, (v) => {
  clearTimeout(timer); active.value = -1
  const term = v.trim()
  if (term.length < 2) { results.value = []; total.value = 0; return }
  timer = setTimeout(async () => {
    const mine = ++seq
    loading.value = true
    try {
      const r = await api('/products', { query: { q: term, limit: 6 } })
      if (mine === seq) { results.value = r.data || []; total.value = r.pagination?.total || 0 }
    } catch { if (mine === seq) results.value = [] } finally { if (mine === seq) loading.value = false }
  }, 200)
})
const brandHits = computed(() => {
  const t = q.value.trim().toLowerCase()
  return t.length < 2 ? [] : brands.value.filter((b) => b.name.toLowerCase().includes(t)).slice(0, 5)
})
const remember = (term) => {
  const list = [term, ...recent.value.filter((x) => x !== term)].slice(0, 6)
  recent.value = list
  try { localStorage.setItem(RECENT, JSON.stringify(list)) } catch { /* private mode */ }
}
const go = (to) => { emit('close'); navigateTo(to) }
const submit = () => {
  if (active.value >= 0 && results.value[active.value]) return go(productUrl(results.value[active.value]))
  const term = q.value.trim()
  if (!term) return
  remember(term)
  go({ path: '/products', query: { q: term } })
}
const move = (d) => {
  if (!results.value.length) return
  active.value = (active.value + d + results.value.length) % results.value.length
}
const range = (p) => {
  const { min, max } = priceOf(p)
  return max > min ? `${money(min)} – ${money(max)}` : money(min)
}
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" enter-active-class="transition duration-200" leave-to-class="opacity-0" leave-active-class="transition duration-150">
      <div v-if="open" data-lenis-prevent class="fixed inset-0 z-[60] bg-noir-950/60 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-label="Search" @click.self="emit('close')" @keydown.esc="emit('close')">
        <div class="s-container pt-6 sm:pt-16">
          <div class="mx-auto max-w-2xl s-search-in">
            <form class="relative" role="search" @submit.prevent="submit">
              <Icon name="lucide:search" class="w-5 h-5 text-gold absolute left-5 top-1/2 -translate-y-1/2" />
              <input
                ref="input" v-model="q" type="search" autocomplete="off" placeholder="Search panjabi, suits, fragrances, brands…" aria-label="Search"
                class="w-full rounded-full bg-noir-900 text-cream placeholder:text-cream/45 ring-1 ring-gold/40 focus:ring-2 focus:ring-gold pl-14 pr-14 py-4 text-lg outline-none"
                @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.esc="emit('close')"
              >
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full text-cream/70 hover:text-gold flex items-center justify-center" aria-label="Close search" @click="emit('close')"><Icon name="lucide:x" class="w-5 h-5" /></button>
            </form>

            <div class="mt-3 rounded-2xl bg-cream text-ink shadow-lift overflow-hidden">
              <template v-if="q.trim().length >= 2">
                <div v-if="brandHits.length" class="px-5 pt-4 flex flex-wrap items-center gap-2">
                  <span class="text-[0.68rem] tracking-[0.2em] uppercase text-ink-faint mr-1">Brands</span>
                  <button v-for="b in brandHits" :key="b._id" class="rounded-full border border-line-strong px-3 py-1 text-sm hover:bg-noir-900 hover:text-gold-light transition" @click="go(`/products?brand=${b.slug}`)">{{ b.name }}</button>
                </div>
                <p class="px-5 pt-4 pb-2 text-[0.68rem] tracking-[0.2em] uppercase text-ink-faint">{{ loading && !results.length ? 'Searching…' : `Products (${total})` }}</p>
                <ul v-if="results.length" :class="{ 'opacity-60': loading }">
                  <li v-for="(p, i) in results" :key="p._id">
                    <NuxtLink :to="productUrl(p)" class="flex items-center gap-4 px-5 py-2.5 transition" :class="active === i ? 'bg-cream-deep' : 'hover:bg-cream-deep/60'" @click="emit('close')" @mouseenter="active = i">
                      <img v-if="imagesOf(p)[0]" :src="imagesOf(p)[0]" alt="" class="w-12 h-12 rounded-lg object-contain p-1 bg-white ring-1 ring-line" loading="lazy">
                      <span class="min-w-0 flex-1">
                        <span v-if="p.brand || p.is_combo" class="block text-[0.65rem] tracking-[0.18em] uppercase text-ink-faint">{{ p.is_combo ? 'Combo' : p.brand.name }}</span>
                        <span class="block truncate text-noir-800">{{ p.title }}</span>
                      </span>
                      <span class="text-sm tabular-nums text-noir-800 shrink-0">{{ range(p) }}</span>
                    </NuxtLink>
                  </li>
                </ul>
                <p v-else-if="!loading" class="px-5 pb-5 text-sm text-ink-soft">Nothing matches “{{ q.trim() }}”. Try a brand, a category, a fabric or a note like oud.</p>
                <button v-if="total > results.length" class="w-full border-t border-line px-5 py-3.5 text-sm font-semibold text-noir-800 hover:bg-cream-deep/60 flex items-center justify-center gap-2" @click="submit">See all {{ total }} results <Icon name="lucide:arrow-right" class="w-4 h-4" /></button>
              </template>
              <div v-else class="px-5 py-5">
                <template v-if="recent.length">
                  <p class="text-[0.68rem] tracking-[0.2em] uppercase text-ink-faint mb-3">Recent searches</p>
                  <div class="flex flex-wrap gap-2 mb-5">
                    <button v-for="r in recent" :key="r" class="rounded-full bg-cream-deep px-3 py-1 text-sm hover:bg-noir-900 hover:text-gold-light transition" @click="q = r">{{ r }}</button>
                  </div>
                </template>
                <p class="text-[0.68rem] tracking-[0.2em] uppercase text-ink-faint mb-3">Try</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="t in suggestions" :key="t" class="rounded-full border border-line-strong px-3 py-1 text-sm hover:bg-noir-900 hover:text-gold-light transition" @click="q = t">{{ t }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
