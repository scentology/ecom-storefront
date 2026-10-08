<script setup>
// The wishlist: signed in, the API list comes with products and the picked size/colour; guests' ids (kept in
// this browser) are fetched one by one. Each card: picked options, price, stock, Add to bag (or choose), remove.
useSeoMeta({ title: 'Wishlist', robots: 'noindex' })
const wish = useWishlist()
const auth = useAuth()
const cart = useCart()

// guests: products fetched by id (cached; removed ids just drop out)
const fetched = ref({})
const fetching = ref(false)
const loadGuest = async () => {
  const missing = wish.items.value.filter((i) => !i.product && !(i.product_id in fetched.value)).map((i) => i.product_id)
  if (!missing.length) return
  fetching.value = true
  try {
    const got = await Promise.all(missing.map((id) => api(`/products/${id}`).then((r) => r.data).catch(() => null)))
    fetched.value = { ...fetched.value, ...Object.fromEntries(missing.map((id, i) => [id, got[i]])) }
  } finally { fetching.value = false }
}
onMounted(() => watch(() => wish.ids.value.join(','), loadGuest, { immediate: true }))

const loading = computed(() => !wish.ready.value || fetching.value)
const entries = computed(() => wish.items.value
  .map((i) => {
    const product = i.product || fetched.value[i.product_id]
    if (!product) return null
    const variants = product.variants || []
    // the picked variant, else the only one there is (nothing to choose)
    const variant = variants.find((v) => v._id === i.variant_id) || (variants.length === 1 && !(product.options || []).length ? variants[0] : null)
    const stock = variant ? variant.online_stock || 0 : onlineStockOf(product)
    const price = variant ? { min: variant.sale_price, max: variant.sale_price, was: variant.original_price > variant.sale_price ? variant.original_price : 0 } : priceOf(product)
    const picked = variant && i.variant_id ? Object.entries(variant.attributes || {}) : []
    const colour = (product.options || []).find((o) => o.type === 'colour')
    return { id: i.product_id, product, variant, stock, any: onlineStockOf(product), price, picked, swatches: colour?.swatches || {}, colourName: colour?.name, thumb: variant?.image || imagesOf(product)[0] || '' }
  })
  .filter(Boolean))

const stockLabel = (e) => {
  if (e.stock <= 0) return e.variant && e.picked.length ? 'Sold out in this choice' : 'Sold out'
  if (e.variant && e.stock <= 5) return `Only ${e.stock} left`
  return 'In stock'
}
const addToBag = (e) => cart.add({
  variant_id: e.variant._id, product_id: e.product._id, slug: e.product.slug, title: e.product.title,
  thumb: e.thumb, attrs: { ...e.variant.attributes }, price: e.variant.sale_price,
  was: e.variant.original_price, max: e.variant.online_stock,
})
</script>

<template>
  <section class="s-container py-12 sm:py-16">
    <UiSectionHeading eyebrow="Your list" title="Wish" highlight="list" />

    <ClientOnly>
      <div v-if="!auth.signedIn.value" class="mt-8 flex flex-col gap-3 rounded-2xl bg-white ring-1 ring-line px-5 py-4 sm:flex-row sm:items-center">
        <Icon name="lucide:cloud" class="w-5 h-5 text-gold-dark shrink-0" />
        <p class="text-sm text-ink-soft flex-1">Sign in to keep your wishlist on every device. What you've saved here comes with you.</p>
        <NuxtLink to="/account?next=/wishlist" class="s-btn-line !py-2 !px-5 self-start sm:self-auto">Sign in</NuxtLink>
      </div>

      <div v-if="loading && !entries.length" class="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="n in 4" :key="n">
          <div class="aspect-[4/5] rounded-xl s-shimmer" />
          <div class="h-4 w-2/3 mt-4 rounded s-shimmer" />
          <div class="h-10 mt-4 rounded-full s-shimmer" />
        </div>
      </div>

      <div v-else-if="!entries.length" class="mt-10 rounded-2xl bg-white ring-1 ring-line px-6 py-14 text-center">
        <Icon name="lucide:heart" class="w-9 h-9 text-gold-dark mx-auto" />
        <h3 class="s-title text-2xl text-noir-800 mt-4">Your wishlist is empty</h3>
        <p class="text-sm text-ink-soft mt-2 max-w-md mx-auto">Tap the heart on any product to keep it here. On a product page, pick your size or colour first and we'll remember it.</p>
        <NuxtLink to="/products" class="s-btn-dark mt-6">Browse the shop <Icon name="lucide:arrow-right" class="w-4 h-4" /></NuxtLink>
      </div>

      <template v-else>
        <p class="mt-6 text-sm text-ink-faint">{{ entries.length }} {{ entries.length === 1 ? 'item' : 'items' }}</p>
        <ul class="mt-4 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          <li v-for="e in entries" :key="e.id" class="relative flex flex-col">
            <NuxtLink :to="productUrl(e.product)" class="group block">
              <div class="relative aspect-[4/5] overflow-hidden rounded-xl bg-white ring-1 ring-line">
                <img v-if="e.thumb" :src="e.thumb" :alt="e.product.title" loading="lazy" class="absolute inset-0 w-full h-full object-contain p-5 transition duration-700 group-hover:scale-[1.04]">
                <div v-else class="absolute inset-0 flex items-center justify-center text-gold-dark"><Icon name="lucide:image" class="w-10 h-10" /></div>
                <span v-if="e.any <= 0" class="absolute left-3 top-3 rounded-full bg-ink/80 text-white text-[0.7rem] font-semibold px-2.5 py-1">Sold out</span>
              </div>
              <p v-if="eyebrowOf(e.product)" class="s-eyebrow text-ink-faint mt-4 truncate">{{ eyebrowOf(e.product) }}</p>
              <h3 class="mt-1 leading-snug text-[0.98rem] group-hover:text-noir-800 line-clamp-2">{{ e.product.title }}</h3>
            </NuxtLink>

            <p v-if="e.picked.length" class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
              <span v-for="[k, v] in e.picked" :key="k" class="inline-flex items-center gap-1">
                <span v-if="k === e.colourName && e.swatches[v]" class="w-2.5 h-2.5 rounded-full ring-1 ring-black/15" :style="{ background: e.swatches[v] }" />
                <span class="text-ink-faint">{{ k }}:</span> {{ v }}
              </span>
            </p>
            <p class="mt-1.5 text-sm tabular-nums">
              <span v-if="e.price.max > e.price.min" class="text-ink-faint">From </span>
              <span class="font-semibold text-noir-800">{{ money(e.price.min) }}</span>
              <s v-if="e.price.was" class="ml-1.5 text-ink-faint">{{ money(e.price.was) }}</s>
            </p>
            <p class="mt-1 text-xs flex items-center gap-1.5" :class="e.stock > 0 ? 'text-green-700' : 'text-ink-faint'">
              <span class="w-1.5 h-1.5 rounded-full" :class="e.stock > 0 ? 'bg-green-600' : 'bg-ink-faint'" /> {{ stockLabel(e) }}
            </p>

            <div class="mt-auto pt-3">
              <button v-if="e.variant && e.stock > 0" class="s-btn-dark w-full !px-3 !py-2.5" @click="addToBag(e)">
                <Icon name="lucide:shopping-bag" class="w-4 h-4 shrink-0" /> Add to bag
              </button>
              <NuxtLink v-else :to="productUrl(e.product)" class="s-btn-line w-full !px-3 !py-2.5">
                {{ e.any <= 0 ? 'View product' : e.variant ? 'Choose another' : 'Choose options' }}
              </NuxtLink>
            </div>

            <button
              class="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-card transition hover:scale-105"
              :aria-label="`Remove ${e.product.title} from your wishlist`" @click="wish.toggle(e.id)"
            >
              <Icon name="lucide:x" class="w-4 h-4 text-ink" />
            </button>
          </li>
        </ul>
      </template>

      <template #fallback>
        <div class="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          <div v-for="n in 4" :key="n"><div class="aspect-[4/5] rounded-xl s-shimmer" /><div class="h-4 w-2/3 mt-4 rounded s-shimmer" /></div>
        </div>
      </template>
    </ClientOnly>
  </section>
</template>
