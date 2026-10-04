<script setup>
const route = useRoute()
const { data: product, error } = await useAsyncData(`product-${route.params.slug}`, async () => (await api(`/products/slug/${route.params.slug}`)).data)
if (error.value || !product.value) throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })

const p = product
const cart = useCart()
const saved = useWishlist()
const { data: attributes } = await useAttributes()
const { data: categories } = await useCategories()
const active = ref(0)

// variant selection: one value per option, starting from the first variant that can be sold online
const options = computed(() => p.value.options || [])
const variants = computed(() => p.value.variants || [])
const firstSellable = variants.value.find((v) => v.online_stock > 0) || variants.value[0]
const picks = reactive({ ...(firstSellable?.attributes || {}) })
const variant = computed(() => variants.value.find((v) => options.value.every((o) => v.attributes?.[o.name] === picks[o.name])) || (options.value.length ? null : variants.value[0]))
// a value is available when some variant with it (and the other current picks) is in stock online
const availableFor = (name) => (value) => variants.value.some((v) => v.online_stock > 0 && v.attributes?.[name] === value
  && options.value.every((o) => o.name === name || !picks[o.name] || v.attributes?.[o.name] === picks[o.name]))

// the chosen variant's own photo leads the gallery; with a colour picked but no full match yet (or no photo on
// the match), a variant of that colour lends its photo
const looks = computed(() => options.value.filter((o) => o.type === 'colour' || o.type === 'image'))
const lookVariant = computed(() => {
  if (variant.value?.image || !looks.value.length) return variant.value
  return variants.value.find((v) => v.image && looks.value.every((o) => !picks[o.name] || v.attributes?.[o.name] === picks[o.name])) || variant.value
})
const pics = computed(() => {
  const base = imagesOf(p.value)
  const own = lookVariant.value?.image
  return own ? [own, ...base.filter((x) => x !== own)] : base
})
watch(() => lookVariant.value?.image, () => { active.value = 0 })

const inStock = computed(() => (variant.value?.online_stock || 0) > 0)
const price = computed(() => (variant.value ? { min: variant.value.sale_price, was: variant.value.original_price > variant.value.sale_price ? variant.value.original_price : 0 } : priceOf(p.value)))
const qty = ref(1)
const inBag = computed(() => cart.lines.value.find((l) => l.variant_id === variant.value?._id)?.qty || 0)
// phones: a buy bar sticks to the bottom once the add-to-bag row scrolls away
const buyRow = ref(null)
const stickyBuy = ref(false)
onMounted(() => {
  if (!buyRow.value || typeof IntersectionObserver === 'undefined') return
  const io = new IntersectionObserver(([e]) => { stickyBuy.value = !e.isIntersecting && e.boundingClientRect.top < 0 })
  io.observe(buyRow.value)
  onBeforeUnmount(() => io.disconnect())
})
watch(variant, () => { qty.value = 1 })
const addToBag = () => {
  if (!variant.value || !inStock.value) return
  cart.add({
    variant_id: variant.value._id, product_id: p.value._id, slug: p.value.slug, title: p.value.title,
    thumb: pics.value[0] || '', attrs: { ...variant.value.attributes }, price: variant.value.sale_price,
    was: variant.value.original_price, max: variant.value.online_stock,
  }, qty.value)
}

// fragrance profile (notes, performance, when to wear) vs. a plain spec list for everything else
const one = (attr) => valuesOf(attributes.value, p.value, attr)[0] || null
const concentration = computed(() => one('concentration'))
const fragrance = computed(() => isFragrance(p.value))
// every visible attribute the product has values for (Fabric, Fit, Occasion, Work… or Concentration, Family…);
// notes, season and occasion have their own blocks
const OWN_BLOCKS = ['notes', 'season', 'occasion']
const details = computed(() => [...attributes.value]
  .filter((a) => a.visible && !OWN_BLOCKS.includes(a.slug) && p.value.facets?.[a.slug]?.length)
  .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  .map((a) => ({ k: a.name, slug: a.slug, filterable: a.filterable, values: valuesOf(attributes.value, p.value, a.slug) })))
const notes = computed(() => [
  { k: 'Top', hint: 'The first impression', list: p.value.notes?.top || [] },
  { k: 'Heart', hint: 'Once it settles', list: p.value.notes?.heart || [] },
  { k: 'Base', hint: 'What lingers', list: p.value.notes?.base || [] },
].filter((t) => t.list.length))
const seasons = computed(() => valuesOf(attributes.value, p.value, 'season'))
const allSeasons = computed(() => attributes.value.find((a) => a.slug === 'season')?.values || [])
const occasions = computed(() => valuesOf(attributes.value, p.value, 'occasion'))
const perf = computed(() => p.value.performance || {})
const hasProfile = computed(() => notes.value.length || perf.value.longevity || perf.value.projection || seasons.value.length || occasions.value.length)
const hasAbout = computed(() => p.value.description || details.value.length || p.value.features?.length)

// size guide: an option named Size + a chart on the sub category (else the category)
const sizeChart = computed(() => sizeChartFor(p.value, categories.value))
const isSize = (o) => /^size$/i.test((o.name || '').trim())
const guideOpen = ref(false)
const sizePick = computed(() => picks[options.value.find(isSize)?.name])
const limited = computed(() => (p.value.facets?.edition || []).includes('limited'))

const { data: fromBrand } = await useAsyncData(`brand-${route.params.slug}`, async () => {
  if (!p.value.brand) return []
  const res = await api('/products', { query: { brand: p.value.brand.slug, limit: 5 } })
  return (res.data || []).filter((x) => x._id !== p.value._id).slice(0, 4)
}, { default: () => [] })
// related: the same fragrance family, else the same sub category (else category); not what "More from" shows
const family = p.value.facets?.family?.[0]
const relatedTo = family ? `/products?f.family=${family}`
  : p.value.sub_category?.slug ? `/products?category=${p.value.sub_category.slug}` : p.value.category?.slug ? `/products?category=${p.value.category.slug}` : '/products'
const { data: related } = await useAsyncData(`related-${route.params.slug}`, async () => {
  const query = family ? { 'f.family': family, limit: 12 }
    : p.value.sub_category_id ? { sub_category_id: p.value.sub_category_id, limit: 12 } : { category_id: p.value.category_id, limit: 12 }
  const res = await api('/products', { query })
  const shown = new Set(fromBrand.value.map((x) => x._id))
  return (res.data || []).filter((x) => x._id !== p.value._id && !shown.has(x._id) && (!family || x.brand_id !== p.value.brand_id)).slice(0, 4)
}, { default: () => [] })

const site = useRuntimeConfig().public.siteUrl
useSeoMeta({
  title: () => p.value.title,
  description: () => (p.value.subtitle || p.value.description || '').slice(0, 160),
  ogImage: () => pics.value[0],
  ogType: 'product',
})
useHead({
  link: [{ rel: 'canonical', href: `${site}/products/${p.value.slug}` }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: p.value.title, image: pics.value, description: p.value.description,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'BDT', lowPrice: priceOf(p.value).min, highPrice: priceOf(p.value).max, availability: onlineStockOf(p.value) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    }),
  }],
})
</script>

<template>
  <div>
    <nav class="s-container pt-6 text-xs text-ink-faint flex flex-wrap gap-1.5" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-noir-800">Home</NuxtLink><span>/</span>
      <NuxtLink v-if="p.category" :to="`/products?category=${p.category.slug}`" class="hover:text-noir-800">{{ p.category.name }}</NuxtLink><span v-if="p.category">/</span>
      <template v-if="p.sub_category?.slug"><NuxtLink :to="`/products?category=${p.sub_category.slug}`" class="hover:text-noir-800">{{ p.sub_category.name }}</NuxtLink><span>/</span></template>
      <span class="text-ink-soft">{{ p.title }}</span>
    </nav>

    <section class="s-container py-8 grid lg:grid-cols-2 gap-10 lg:gap-16">
      <!-- gallery -->
      <div class="lg:sticky lg:top-28 self-start">
        <ProductGallery v-model="active" :pics="pics" :title="p.title" :badge="discountOf(p) ? `−${discountOf(p)}%` : ''" />
      </div>

      <!-- details -->
      <div>
        <p class="s-eyebrow text-ink-faint flex flex-wrap items-center gap-2">
          <NuxtLink v-if="p.is_combo" to="/combos" class="text-gold-dark hover:text-noir-800">{{ comboLabel(p, variant?.bundle?.length || 0) }}</NuxtLink>
          <NuxtLink v-else-if="p.brand" :to="`/products?brand=${p.brand.slug}`" class="hover:text-noir-800">{{ p.brand.name }}</NuxtLink>
          <span v-else-if="categoryLabel(p)">{{ categoryLabel(p) }}</span>
          <template v-if="concentration"><span class="text-gold">•</span><NuxtLink :to="`/products?f.concentration=${concentration.slug}`" class="hover:text-noir-800">{{ concentration.label }}</NuxtLink></template>
        </p>
        <h1 class="s-title text-4xl sm:text-5xl text-noir-800 mt-2">{{ p.title }}</h1>
        <a v-if="p.rating?.count" href="#reviews" class="inline-flex items-center gap-2 mt-3 text-sm text-ink-soft hover:text-noir-800"><ProductStars :value="p.rating.average" /> {{ p.rating.average.toFixed(1) }} · {{ p.rating.count }} {{ p.rating.count === 1 ? 'review' : 'reviews' }}</a>
        <div v-if="limited || p.featured" class="flex gap-2 mt-3">
          <span v-if="limited" class="rounded-full bg-noir-800 text-gold-light text-[0.7rem] font-semibold tracking-wide uppercase px-3 py-1">Limited edition</span>
          <span v-if="p.featured" class="rounded-full bg-gold/15 text-gold-dark text-[0.7rem] font-semibold tracking-wide uppercase px-3 py-1">Featured</span>
        </div>
        <p v-if="p.subtitle" class="text-ink-soft mt-3 text-lg">{{ p.subtitle }}</p>
        <p class="mt-6 flex items-baseline gap-3 tabular-nums">
          <span class="text-3xl font-semibold text-noir-900">{{ money(price.min) }}</span>
          <s v-if="price.was" class="text-ink-faint text-lg">{{ money(price.was) }}</s>
          <span v-if="price.was" class="rounded-full bg-sale/10 text-sale text-xs font-bold px-2.5 py-1">Save {{ money(price.was - price.min) }}</span>
        </p>
        <p v-if="variant?.caption" class="text-sm text-ink-soft mt-2">{{ variant.caption }}</p>
        <p v-if="p.is_combo && !price.was && variant?.bundle_value > variant?.sale_price" class="mt-3 inline-flex items-center gap-2 rounded-full bg-gold/15 text-gold-dark text-sm font-semibold px-3.5 py-1.5">
          <Icon name="lucide:gift" class="w-4 h-4" /> {{ money(variant.bundle_value - variant.sale_price) }} less than buying them one by one ({{ money(variant.bundle_value) }})
        </p>

        <div v-if="p.is_combo && variant?.bundle?.length" class="mt-8">
          <h2 class="font-display text-2xl text-noir-800">What's inside</h2>
          <ul class="mt-4 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            <li v-for="b in variant.bundle" :key="b.variant_id">
              <NuxtLink :to="b.slug ? `/products/${b.slug}` : '#'" class="flex items-center gap-4 p-4 hover:bg-cream/60 transition">
                <img v-if="b.thumb" :src="b.thumb" alt="" class="w-14 h-14 rounded-lg object-cover ring-1 ring-line" loading="lazy">
                <span class="flex-1 min-w-0">
                  <span class="block text-noir-800 font-medium truncate">{{ b.title }}</span>
                  <span class="block text-xs text-ink-faint">{{ Object.values(b.attributes || {}).join(' · ') || 'One size' }}</span>
                </span>
                <span class="text-sm text-ink-soft tabular-nums">× {{ b.quantity }}</span>
                <Icon name="lucide:chevron-right" class="w-4 h-4 text-ink-faint" />
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="mt-8 space-y-6">
          <ProductOptionPicker v-for="o in options" :key="o.name" v-model="picks[o.name]" :option="o" :available="availableFor(o.name)" :guide="!!sizeChart && isSize(o)" @guide="guideOpen = true" />
        </div>

        <p class="mt-6 text-sm flex items-center gap-2" :class="inStock ? 'text-green-700' : 'text-sale'">
          <Icon :name="inStock ? 'lucide:circle-check' : 'lucide:circle-x'" class="w-4 h-4" />
          <template v-if="!variant">This combination isn't available</template>
          <template v-else-if="!inStock">Out of stock online</template>
          <template v-else-if="variant.online_stock <= 5">Only {{ variant.online_stock }} left</template>
          <template v-else>In stock, ready to ship</template>
        </p>

        <ClientOnly>
          <p v-if="inBag" class="mt-4 flex items-center gap-2 rounded-xl bg-gold/10 ring-1 ring-gold/30 px-4 py-2.5 text-sm text-noir-800">
            <Icon name="lucide:shopping-bag" class="w-4 h-4 text-gold-dark" /> {{ inBag }} of this in your bag
            <button class="ml-auto text-xs font-semibold underline" @click="cart.open.value = true">View bag</button>
          </p>
        </ClientOnly>

        <div ref="buyRow" class="mt-6 flex gap-3">
          <div class="inline-flex items-center rounded-full border border-line-strong bg-white">
            <button class="p-3.5" aria-label="One less" :disabled="qty <= 1" @click="qty--"><Icon name="lucide:minus" class="w-4 h-4" /></button>
            <span class="w-8 text-center tabular-nums" aria-live="polite">{{ qty }}</span>
            <button class="p-3.5" aria-label="One more" :disabled="!variant || qty >= variant.online_stock" @click="qty++"><Icon name="lucide:plus" class="w-4 h-4" /></button>
          </div>
          <button class="s-btn-dark flex-1" :disabled="!inStock" @click="addToBag"><Icon name="lucide:shopping-bag" class="w-4 h-4" /> {{ inStock ? 'Add to bag' : 'Sold out' }}</button>
          <ClientOnly>
            <button class="s-btn-line !px-4" :aria-pressed="saved.has(p._id)" :aria-label="saved.has(p._id) ? 'Remove from saved' : 'Save'" @click="saved.toggle(p._id)">
              <Icon name="lucide:heart" class="w-5 h-5" :class="saved.has(p._id) ? 'text-sale fill-current' : ''" />
            </button>
          </ClientOnly>
        </div>

        <ClientOnly><ProductStoreStock :variant-id="variant?._id" /></ClientOnly>

        <ul class="mt-8 grid grid-cols-2 gap-3 text-sm">
          <li class="rounded-xl bg-white ring-1 ring-line p-4 flex gap-3"><Icon name="lucide:truck" class="w-5 h-5 text-noir-800 shrink-0" /> Delivery in 1–4 days</li>
          <li class="rounded-xl bg-white ring-1 ring-line p-4 flex gap-3"><Icon name="lucide:banknote" class="w-5 h-5 text-noir-800 shrink-0" /> Cash on delivery</li>
          <li class="rounded-xl bg-white ring-1 ring-line p-4 flex gap-3"><Icon name="lucide:rotate-ccw" class="w-5 h-5 text-noir-800 shrink-0" /> Easy 7 day returns</li>
          <li class="rounded-xl bg-white ring-1 ring-line p-4 flex gap-3"><Icon name="lucide:badge-check" class="w-5 h-5 text-noir-800 shrink-0" /> {{ fragrance ? '100% authentic' : 'Quality checked' }}</li>
        </ul>

      </div>
    </section>

    <!-- about: the description and features, beside a spec list of the product's attributes -->
    <section v-if="hasAbout" class="s-container py-12 border-t border-line">
      <div class="grid lg:grid-cols-[1fr_22rem] gap-10 lg:gap-16">
        <div v-reveal="'left'">
          <h2 class="s-title text-3xl text-noir-800">{{ fragrance ? 'About the fragrance' : 'About this piece' }}</h2>
          <p v-if="p.description" class="mt-5 text-ink-soft leading-relaxed whitespace-pre-line max-w-2xl">{{ p.description }}</p>
          <ul v-if="p.features?.length" class="mt-6 space-y-2 max-w-2xl">
            <li v-for="f in p.features" :key="f" class="flex gap-2 text-ink-soft"><Icon name="lucide:check" class="w-4 h-4 mt-1 text-gold-dark shrink-0" />{{ f }}</li>
          </ul>
        </div>
        <div v-if="details.length" v-reveal="'right'" class="self-start">
          <h3 class="s-eyebrow text-gold-dark">Details</h3>
          <dl class="mt-3 divide-y divide-line border-y border-line">
            <div v-for="d in details" :key="d.slug" class="flex justify-between gap-6 py-3.5 text-sm">
              <dt class="text-ink-faint">{{ d.k }}</dt>
              <dd class="text-right font-semibold text-noir-800">
                <template v-for="(v, i) in d.values" :key="v.slug"><template v-if="i">, </template><NuxtLink v-if="d.filterable" :to="`/products?f.${d.slug}=${v.slug}`" class="hover:underline">{{ v.label }}</NuxtLink><template v-else>{{ v.label }}</template></template>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- fragrance profile -->
    <section v-if="hasProfile" class="s-container py-12 border-t border-line space-y-14">
      <div v-if="notes.length">
        <h2 class="s-title text-3xl text-noir-800">Notes</h2>
        <ol class="mt-6 grid sm:grid-cols-3 gap-4">
          <li v-for="(t, i) in notes" :key="t.k" v-reveal="{ dir: 'up', delay: i * 90 }" class="rounded-2xl bg-white ring-1 ring-line p-6">
            <p class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-full bg-noir-800 text-gold-light flex items-center justify-center text-sm font-semibold">{{ i + 1 }}</span>
              <span><span class="block font-display text-xl text-noir-800">{{ t.k }} notes</span><span class="block text-xs text-ink-faint">{{ t.hint }}</span></span>
            </p>
            <div class="flex flex-wrap gap-2 mt-5">
              <NuxtLink v-for="n in t.list" :key="n" :to="`/products?f.notes=${n}`" class="s-chip !py-1.5 !text-xs">{{ valueLabel(attributes, 'notes', n) }}</NuxtLink>
            </div>
          </li>
        </ol>
      </div>

      <div v-if="perf.longevity || perf.projection || seasons.length || occasions.length" class="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div v-if="perf.longevity || perf.projection" v-reveal="'left'">
          <h2 class="s-title text-3xl text-noir-800">Performance</h2>
          <div v-for="m in [{ k: 'Longevity', v: perf.longevity, max: 5, scale: LONGEVITY }, { k: 'Projection', v: perf.projection, max: 4, scale: PROJECTION }].filter((x) => x.v)" :key="m.k" class="mt-6">
            <p class="flex justify-between text-sm"><span class="text-ink-soft">{{ m.k }}</span><span class="font-semibold text-noir-800">{{ m.scale[m.v].label }}</span></p>
            <div class="flex gap-1.5 mt-2" role="img" :aria-label="`${m.k}: ${m.v} of ${m.max}`">
              <span v-for="i in m.max" :key="i" class="h-1.5 flex-1 rounded-full" :class="i <= m.v ? 'bg-noir-800' : 'bg-line'" />
            </div>
            <p class="text-xs text-ink-faint mt-1.5">{{ m.scale[m.v].hint }}</p>
          </div>
        </div>
        <div v-if="seasons.length || occasions.length" v-reveal="'right'">
          <h2 class="s-title text-3xl text-noir-800">When to wear</h2>
          <div v-if="allSeasons.length" class="flex flex-wrap gap-5 mt-6">
            <NuxtLink v-for="s in allSeasons" :key="s.slug" :to="`/products?f.season=${s.slug}`" class="text-center group" :class="seasons.some((x) => x.slug === s.slug) ? '' : 'opacity-35'">
              <span class="w-14 h-14 rounded-full flex items-center justify-center transition" :class="seasons.some((x) => x.slug === s.slug) ? 'bg-noir-800 text-gold-light' : 'bg-cream-deep text-ink-faint'">
                <Icon :name="s.icon || 'lucide:calendar'" class="w-5 h-5" />
              </span>
              <span class="block text-xs mt-2 font-semibold">{{ s.label }}</span>
            </NuxtLink>
          </div>
          <div v-if="occasions.length" class="flex flex-wrap gap-2 mt-6">
            <NuxtLink v-for="o in occasions" :key="o.slug" :to="`/products?f.occasion=${o.slug}`" class="s-chip !py-1.5 !text-xs">{{ o.label }}</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <ProductReviews :product-id="p._id" />

    <section v-if="fromBrand.length" class="s-container py-16">
      <UiSectionHeading eyebrow="The house" :title="`More from`" :highlight="p.brand.name" :to="`/products?brand=${p.brand.slug}`" />
      <ProductGrid class="mt-10" :products="fromBrand" />
    </section>

    <section v-if="related.length" class="s-container py-16">
      <UiSectionHeading v-if="fragrance && family" eyebrow="You may also like" title="Smells a bit" highlight="like this" :to="relatedTo" />
      <UiSectionHeading v-else eyebrow="You may also like" :title="categoryLabel(p) ? 'More in' : 'More to'" :highlight="categoryLabel(p) || 'discover'" :to="relatedTo" />
      <ProductGrid class="mt-10" :products="related" />
    </section>
    <ProductSizeGuide v-model="guideOpen" :chart="sizeChart" :title="categoryLabel(p) ? `${categoryLabel(p)} sizes` : p.title" :current="sizePick" />
    <!-- phones: buy bar -->
    <Transition enter-from-class="translate-y-full" enter-active-class="transition duration-300" leave-to-class="translate-y-full" leave-active-class="transition duration-200">
      <div v-if="stickyBuy" class="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-noir-900 text-cream px-4 py-3 flex items-center gap-3 shadow-lift">
        <span class="min-w-0 flex-1"><span class="block text-sm truncate">{{ p.title }}</span><span class="block text-xs text-gold-light tabular-nums">{{ money(price.min) }}<template v-if="variant"> · {{ Object.values(variant.attributes || {}).join(' ') }}</template></span></span>
        <button class="s-btn-gold !py-2.5 !px-5" :disabled="!inStock" @click="addToBag">{{ inStock ? 'Add to bag' : 'Sold out' }}</button>
      </div>
    </Transition>
  </div>
</template>
