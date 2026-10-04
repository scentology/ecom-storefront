<script setup>
// Combos: sets of products (fragrance pairings, outfit sets…) priced below buying them one by one (sold from the same stock).
const route = useRoute()
const router = useRouter()
const { data: attributes } = await useAttributes()
const SORTS = { best: { label: 'Best sellers', api: 'best_seller:desc' }, new: { label: 'Newest', api: 'timestamp.created_at:desc' }, price_asc: { label: 'Price: low to high', api: 'sale_price:asc' }, price_desc: { label: 'Price: high to low', api: 'sale_price:desc' } }
const PAGE = 12
const q = computed(() => route.query)
const page = computed(() => Math.max(1, Number(q.value.page) || 1))
const sort = computed(() => (SORTS[q.value.sort] ? q.value.sort : 'best'))
const genders = computed(() => attributes.value.find((a) => a.slug === 'gender')?.values || [])
const query = computed(() => ({ combo: true, page: page.value, limit: PAGE, sort_by: SORTS[sort.value].api, q: q.value.q, 'f.gender': q.value.gender }))
const { data, pending } = await useAsyncData('combos', () => api('/products', { query: query.value }), { watch: [query], default: () => ({ data: [], pagination: null }) })
const products = computed(() => data.value?.data || [])
const total = computed(() => data.value?.pagination?.total || 0)
const pages = computed(() => Math.max(1, Math.ceil(total.value / PAGE)))
const set = (patch) => {
  const next = { ...q.value, ...patch }
  if (!('page' in patch)) delete next.page
  for (const k of Object.keys(next)) if (next[k] === '' || next[k] == null) delete next[k]
  router.push({ query: next })
}
const search = ref(q.value.q || '')
let timer
watch(search, (v) => { clearTimeout(timer); timer = setTimeout(() => set({ q: v.trim() || undefined }), 300) })
useSeoMeta({ title: 'Combos & sets', description: 'Expertly paired sets, priced below buying them one by one.' })
</script>

<template>
  <div>
    <UiPageHero eyebrow="Curated sets" title="Combos & sets" :note="pending ? 'Loading…' : `${total} expertly paired ${total === 1 ? 'set' : 'sets'}, priced to save`" />
    <div class="border-b border-line bg-cream-deep/60">
      <div class="s-container py-4 flex flex-wrap items-center gap-3">
        <input v-model="search" class="s-input !py-2.5 sm:!w-80" placeholder="Search combos" aria-label="Search combos">
        <div v-if="genders.length" class="flex gap-2 overflow-x-auto">
          <button class="s-chip shrink-0" :class="{ 's-chip-on': !q.gender }" @click="set({ gender: undefined })">Everyone</button>
          <button v-for="g in genders" :key="g.slug" class="s-chip shrink-0" :class="{ 's-chip-on': q.gender === g.slug }" @click="set({ gender: g.slug })">{{ g.label }}</button>
        </div>
        <select :value="sort" class="s-input !w-auto !py-2.5 !pr-10 sm:ml-auto" aria-label="Sort" @change="set({ sort: $event.target.value })">
          <option v-for="(s, k) in SORTS" :key="k" :value="k">{{ s.label }}</option>
        </select>
      </div>
    </div>
    <div class="s-container py-12">
      <ProductGrid :products="products" :loading="pending && !products.length" cols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" :skeletons="8" />
      <p v-if="!pending && !products.length" class="text-center py-16 text-ink-soft">No combos match. <button class="underline" @click="router.push({ query: {} })">See them all</button></p>
      <nav v-if="pages > 1" class="flex items-center justify-center gap-2 mt-14" aria-label="Pages">
        <button class="s-chip" :disabled="page <= 1" @click="set({ page: page - 1 })"><Icon name="lucide:chevron-left" class="w-4 h-4" /> Previous</button>
        <span class="text-sm text-ink-soft px-3 tabular-nums">Page {{ page }} of {{ pages }}</span>
        <button class="s-chip" :disabled="page >= pages" @click="set({ page: page + 1 })">Next <Icon name="lucide:chevron-right" class="w-4 h-4" /></button>
      </nav>
    </div>
  </div>
</template>
