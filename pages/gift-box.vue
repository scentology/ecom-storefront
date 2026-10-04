<script setup>
// Gift box builder: 1 pick up to N items (any size or variant), 2 write the card, 3 add the lot (with the box) to the
// bag and check out. The box itself is the shop's gift box product; its settings live in the shop details.
const shop = useShop()
const cart = useCart()
const gift = computed(() => shop.value.gift_box || {})
const max = computed(() => gift.value.max_items || 2)
const { data: box } = await useAsyncData('gift-box-product', async () => {
  const id = shop.value.gift_box?.product_id
  return id ? (await api(`/products/${id}`)).data : {}
}, { watch: [() => shop.value.gift_box?.product_id], default: () => ({}) })
const boxVariant = computed(() => box.value?._id && box.value.variants?.find((v) => v.online_stock > 0) || box.value?.variants?.[0] || null)

const step = ref(1)
const picks = ref([]) // { product, variant }

// the items to choose from: searchable, by brand, paged
const { data: brands } = await useBrands()
const q = ref('')
const brand = ref('')
const page = ref(1)
const PAGE = 9
const query = computed(() => ({ q: q.value.trim() || undefined, brand: brand.value || undefined, combo: false, page: page.value, limit: PAGE, sort_by: 'featured:desc,best_seller:desc' }))
const { data: list, pending } = await useAsyncData('gift-choices', () => api('/products', { query: query.value }), { watch: [query], default: () => ({ data: [], pagination: null }) })
let timer
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => { page.value = 1 }, 250) })
watch(brand, () => { page.value = 1 })
const choices = computed(() => list.value?.data || [])
const pages = computed(() => Math.max(1, Math.ceil((list.value?.pagination?.total || 0) / PAGE)))
const sizeOf = reactive({}) // product id → chosen variant id
const variantOf = (p) => (p.variants || []).find((v) => v._id === sizeOf[p._id]) || (p.variants || []).find((v) => v.online_stock > 0) || p.variants?.[0]
const inBox = (p) => picks.value.some((x) => x.product._id === p._id)
const full = computed(() => picks.value.length >= max.value)
const add = (p) => {
  const v = variantOf(p)
  if (!v || v.online_stock <= 0 || full.value || inBox(p)) return
  picks.value.push({ product: p, variant: v })
}
const remove = (i) => picks.value.splice(i, 1)

// the card
const card = reactive({ to: '', from: '', message: '' })
const message = computed(() => [card.to && `To ${card.to}`, card.message.trim(), card.from && `With love, ${card.from}`].filter(Boolean).join('\n'))

const total = computed(() => picks.value.reduce((n, x) => n + x.variant.sale_price, 0) + (boxVariant.value?.sale_price || 0))
const ready = computed(() => picks.value.length > 0 && boxVariant.value && boxVariant.value.online_stock > 0)
const finish = () => {
  if (!ready.value) return
  for (const x of picks.value) {
    cart.add({ variant_id: x.variant._id, product_id: x.product._id, slug: x.product.slug, title: x.product.title, thumb: x.variant.image || imagesOf(x.product)[0] || '', attrs: { ...x.variant.attributes }, price: x.variant.sale_price, was: x.variant.original_price, max: x.variant.online_stock })
  }
  const b = boxVariant.value
  cart.add({ variant_id: b._id, product_id: box.value._id, slug: box.value.slug, title: box.value.title, thumb: imagesOf(box.value)[0] || '', attrs: {}, price: b.sale_price, was: b.original_price, max: b.online_stock })
  cart.giftMessage.value = message.value
  navigateTo('/checkout')
}
useSeoMeta({ title: 'Create a gift box', description: 'Choose the gifts, write a card, and we wrap it in our gift box.' })
const STEPS = ['Select', 'Personalise', 'Checkout']
</script>

<template>
  <div>
    <section class="relative s-band text-cream overflow-hidden">
      <img v-if="gift.image" :src="gift.image" alt="" class="absolute inset-0 w-full h-full object-cover opacity-45 s-kenburns">
      <span class="absolute inset-0 bg-gradient-to-b from-noir-950/40 via-noir-950/30 to-noir-950/80" />
      <div class="relative s-container py-20 sm:py-28 text-center">
        <h1 class="s-title text-5xl sm:text-7xl animate-rise">The art of <em class="font-display italic s-gold-text block">gifting luxury</em></h1>
        <span class="s-rule mx-auto mt-6 animate-rise [animation-delay:120ms]" />
        <p class="mt-6 text-cream/80 max-w-xl mx-auto animate-rise [animation-delay:200ms]">Choose the gifts, a fragrance, a panjabi or both, write a card, and we wrap it all in our gift box.</p>
        <ol class="flex items-center justify-center gap-4 sm:gap-8 mt-10" aria-label="Steps">
          <li v-for="(s, i) in STEPS" :key="s" class="flex items-center gap-3">
            <button class="flex flex-col items-center gap-2" :disabled="i + 1 > step && !(i === 1 && picks.length) " @click="i + 1 <= step || picks.length ? (step = i + 1) : null">
              <span class="w-11 h-11 rounded-full flex items-center justify-center font-semibold transition" :class="step >= i + 1 ? 'bg-gold-light text-noir-900' : 'ring-1 ring-white/30 text-cream/70'">{{ i + 1 }}</span>
              <span class="text-xs" :class="step >= i + 1 ? 'text-cream' : 'text-cream/60'">{{ s }}</span>
            </button>
            <span v-if="i < STEPS.length - 1" class="hidden sm:block w-20 h-px" :class="step > i + 1 ? 'bg-gold' : 'bg-white/25'" />
          </li>
        </ol>
      </div>
    </section>

    <section class="s-container py-12 grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
      <div class="min-w-0">
        <!-- 1: select -->
        <div v-if="step === 1">
          <div class="rounded-2xl bg-white ring-1 ring-line p-6">
            <h2 class="font-display text-3xl text-noir-800">Select gifts</h2>
            <p class="text-ink-soft text-sm mt-1">Choose up to {{ max }} for your gift box, in the size you like.</p>
            <div class="flex flex-col sm:flex-row gap-3 mt-5">
              <input v-model="q" class="s-input" placeholder="Search by name or note" aria-label="Search">
              <select v-model="brand" class="s-input sm:!w-56" aria-label="Brand"><option value="">All brands</option><option v-for="b in brands" :key="b._id" :value="b.slug">{{ b.name }}</option></select>
            </div>
          </div>
          <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6" :class="{ 'opacity-60': pending }">
            <article v-for="p in choices" :key="p._id" class="rounded-2xl bg-white ring-1 p-4 flex flex-col transition" :class="inBox(p) ? 'ring-noir-800' : 'ring-line'">
              <div class="flex gap-3">
                <img v-if="imagesOf(p)[0]" :src="imagesOf(p)[0]" :alt="p.title" class="w-20 h-20 rounded-xl object-cover ring-1 ring-line" loading="lazy">
                <div class="min-w-0">
                  <p class="text-[0.65rem] tracking-[0.18em] uppercase text-ink-faint">{{ p.brand?.name }}</p>
                  <p class="font-display text-lg leading-snug text-noir-800 line-clamp-2">{{ p.title }}</p>
                  <p class="text-sm tabular-nums mt-1">{{ money(variantOf(p)?.sale_price) }}</p>
                </div>
              </div>
              <select v-if="(p.variants || []).length > 1" v-model="sizeOf[p._id]" class="s-input !py-2 !text-sm mt-3" :aria-label="`Option for ${p.title}`" :disabled="inBox(p)">
                <option v-for="v in p.variants" :key="v._id" :value="v._id" :disabled="v.online_stock <= 0">{{ Object.values(v.attributes || {}).join(' ') || 'Standard' }} · {{ money(v.sale_price) }}{{ v.online_stock <= 0 ? ' (sold out)' : '' }}</option>
              </select>
              <button class="mt-3 s-btn !py-2 text-sm" :class="inBox(p) ? 's-btn-dark' : 's-btn-line'" :disabled="!inBox(p) && (full || (variantOf(p)?.online_stock || 0) <= 0)" @click="inBox(p) ? remove(picks.findIndex((x) => x.product._id === p._id)) : add(p)">
                <Icon :name="inBox(p) ? 'lucide:check' : 'lucide:plus'" class="w-4 h-4" /> {{ inBox(p) ? 'In your box' : full ? 'Box is full' : 'Add to box' }}
              </button>
            </article>
          </div>
          <nav v-if="pages > 1" class="flex items-center justify-center gap-2 mt-8" aria-label="Pages">
            <button class="s-chip" :disabled="page <= 1" @click="page--"><Icon name="lucide:chevron-left" class="w-4 h-4" /></button>
            <span class="text-sm text-ink-soft tabular-nums px-2">Page {{ page }} of {{ pages }}</span>
            <button class="s-chip" :disabled="page >= pages" @click="page++"><Icon name="lucide:chevron-right" class="w-4 h-4" /></button>
          </nav>
        </div>

        <!-- 2: personalise -->
        <div v-else-if="step === 2" class="grid md:grid-cols-2 gap-6">
          <form class="rounded-2xl bg-white ring-1 ring-line p-6 space-y-4" @submit.prevent="step = 3">
            <h2 class="font-display text-3xl text-noir-800">Write the card</h2>
            <input v-model="card.to" class="s-input" maxlength="40" placeholder="To (their name)" aria-label="To">
            <textarea v-model="card.message" rows="5" class="s-input" maxlength="220" placeholder="Your message" aria-label="Message" />
            <p class="text-xs text-ink-faint text-right -mt-2 tabular-nums">{{ card.message.length }}/220</p>
            <input v-model="card.from" class="s-input" maxlength="40" placeholder="From (your name)" aria-label="From">
            <button class="s-btn-dark w-full">Continue</button>
          </form>
          <div class="rounded-2xl s-band p-8 flex items-center justify-center">
            <div class="w-full max-w-xs aspect-[3/4] rounded-xl bg-cream text-noir-800 shadow-lift p-7 flex flex-col text-center rotate-[-2deg]">
              <p class="text-[0.6rem] tracking-[0.3em] uppercase text-gold-dark">{{ shop.name }}</p>
              <span class="s-rule mx-auto mt-3 !w-10" />
              <p class="font-display text-2xl mt-6">{{ card.to ? `Dear ${card.to},` : 'Dear…' }}</p>
              <p class="font-display text-lg italic mt-4 leading-relaxed whitespace-pre-line flex-1 text-ink-soft">{{ card.message || 'Your message appears here.' }}</p>
              <p class="font-display text-lg mt-4">{{ card.from ? `With love, ${card.from}` : '' }}</p>
            </div>
          </div>
        </div>

        <!-- 3: checkout -->
        <div v-else class="rounded-2xl bg-white ring-1 ring-line p-6">
          <h2 class="font-display text-3xl text-noir-800">Ready to wrap</h2>
          <p class="text-ink-soft text-sm mt-1">Everything goes in your bag with the gift box; the card is printed from your message.</p>
          <pre v-if="message" class="mt-5 whitespace-pre-line font-display text-lg italic text-noir-800 bg-cream-deep/60 rounded-xl p-5">{{ message }}</pre>
          <button class="s-btn-gold w-full mt-6" :disabled="!ready" @click="finish">Add the gift box to my bag and check out · {{ money(total) }}</button>
          <p v-if="!boxVariant || boxVariant.online_stock <= 0" class="text-sm text-sale mt-3">Gift boxes are out of stock right now: please try again soon.</p>
        </div>
      </div>

      <!-- your box -->
      <aside class="rounded-2xl bg-white ring-1 ring-line overflow-hidden lg:sticky lg:top-28">
        <div class="bg-gold-light/70 px-6 py-5">
          <p class="font-display text-2xl text-noir-800 flex items-center gap-2"><Icon name="lucide:gift" class="w-5 h-5" /> Your gift box</p>
          <p class="text-xs text-noir-800/70 mt-1">Curated with care</p>
        </div>
        <div class="p-6">
          <p class="text-sm font-semibold text-noir-800">Chosen ({{ picks.length }}/{{ max }})</p>
          <ul v-if="picks.length" class="mt-3 space-y-3">
            <li v-for="(x, i) in picks" :key="x.product._id" class="flex items-center gap-3">
              <img :src="x.variant.image || imagesOf(x.product)[0]" alt="" class="w-12 h-12 rounded-lg object-cover ring-1 ring-line">
              <span class="min-w-0 flex-1"><span class="block text-sm truncate text-noir-800">{{ x.product.title }}</span><span class="block text-xs text-ink-faint">{{ Object.values(x.variant.attributes || {}).join(' ') }} · {{ money(x.variant.sale_price) }}</span></span>
              <button class="text-ink-faint hover:text-sale p-1" :aria-label="`Remove ${x.product.title}`" @click="remove(i)"><Icon name="lucide:x" class="w-4 h-4" /></button>
            </li>
          </ul>
          <div v-else class="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-faint"><Icon name="lucide:package-open" class="w-7 h-7 mx-auto mb-2" />Nothing chosen yet</div>
          <div v-if="gift.includes?.length" class="mt-5 rounded-xl bg-cream-deep/60 p-4">
            <p class="text-xs font-semibold text-noir-800">Included in your gift box</p>
            <ul class="mt-2 space-y-1 text-xs text-ink-soft"><li v-for="inc in gift.includes" :key="inc" class="flex gap-2"><Icon name="lucide:check" class="w-3.5 h-3.5 text-gold-dark mt-0.5 shrink-0" />{{ inc }}</li></ul>
          </div>
          <dl v-if="picks.length" class="mt-5 space-y-1.5 text-sm">
            <div v-if="boxVariant" class="flex justify-between text-ink-soft"><dt>Gift box</dt><dd class="tabular-nums">{{ money(boxVariant.sale_price) }}</dd></div>
            <div class="flex justify-between font-semibold text-noir-800"><dt>Total</dt><dd class="tabular-nums">{{ money(total) }}</dd></div>
          </dl>
          <button v-if="step < 3" class="s-btn-dark w-full mt-5" :disabled="!picks.length" @click="step++">{{ step === 1 ? 'Next: write the card' : 'Next: review' }}</button>
        </div>
      </aside>
    </section>
  </div>
</template>
