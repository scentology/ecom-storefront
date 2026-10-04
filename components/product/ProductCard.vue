<script setup>
// Grid card: image (second image on hover), brand/category eyebrow, title, colour dots, price; heart adds it to the wishlist.
const props = defineProps({ product: { type: Object, required: true }, eager: Boolean })
const saved = useWishlist()
const price = computed(() => priceOf(props.product))
const off = computed(() => discountOf(props.product))
const pics = computed(() => imagesOf(props.product))
// colour swatches under the title (first colour option, up to 5)
const colours = computed(() => {
  const o = (props.product.options || []).find((x) => x.type === 'colour' && x.values?.length > 1)
  return o ? o.values.map((v) => ({ name: v, hex: o.swatches?.[v] || '#ddd' })) : []
})
const soldOut = computed(() => (props.product.variants || []).length > 0 && onlineStockOf(props.product) <= 0)
</script>

<template>
  <article class="group relative">
    <NuxtLink :to="productUrl(product)" class="block">
      <div class="relative aspect-[4/5] overflow-hidden rounded-xl bg-white ring-1 ring-line">
        <img
          v-if="pics[0]" :src="pics[0]" :alt="product.title" :loading="eager ? 'eager' : 'lazy'"
          class="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]" :class="{ 'group-hover:opacity-0': pics[1] }"
        >
        <img v-if="pics[1]" :src="pics[1]" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover opacity-0 transition duration-700 group-hover:opacity-100">
        <div v-if="!pics[0]" class="absolute inset-0 flex items-center justify-center text-gold-dark"><Icon name="lucide:image" class="w-10 h-10" /></div>
        <div class="absolute left-3 top-3 flex flex-col gap-1.5">
          <span v-if="comboSaving(product)" class="rounded-full bg-gold-light text-noir-900 text-[0.68rem] font-bold uppercase tracking-wide px-2.5 py-1">Save {{ money(comboSaving(product)) }}</span>
          <span v-else-if="off" class="rounded-full bg-sale text-white text-[0.7rem] font-bold px-2.5 py-1">−{{ off }}%</span>
          <span v-if="soldOut" class="rounded-full bg-ink/80 text-white text-[0.7rem] font-semibold px-2.5 py-1">Sold out</span>
        </div>
      </div>
      <div class="pt-4 text-center px-2">
        <p v-if="product.is_combo" class="s-eyebrow text-gold-dark">{{ comboLabel(product, product.variants?.[0]?.bundle?.length || 0) }}</p>
        <p v-else-if="eyebrowOf(product)" class="s-eyebrow text-ink-faint">{{ eyebrowOf(product) }}</p>
        <h3 class="mt-1.5 leading-snug text-[0.98rem] group-hover:text-noir-800">{{ product.title }}</h3>
        <p v-if="product.rating?.count" class="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-faint"><ProductStars :value="product.rating.average" size="w-3 h-3" /> {{ product.rating.count }}</p>
        <p v-if="colours.length" class="mt-2 flex items-center justify-center gap-1.5" :aria-label="`${colours.length} colours`">
          <span v-for="c in colours.slice(0, 5)" :key="c.name" class="w-3 h-3 rounded-full ring-1 ring-black/15" :style="{ background: c.hex }" :title="c.name" />
          <span v-if="colours.length > 5" class="text-[0.68rem] text-ink-faint">+{{ colours.length - 5 }}</span>
        </p>
        <p class="mt-1.5 text-sm tabular-nums">
          <span v-if="price.max > price.min" class="text-ink-faint">From </span>
          <span class="font-semibold text-noir-800">{{ money(price.min) }}</span>
          <s v-if="price.was" class="ml-1.5 text-ink-faint">{{ money(price.was) }}</s>
        </p>
      </div>
    </NuxtLink>
    <ClientOnly>
      <button
        class="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-card transition hover:scale-105"
        :aria-label="saved.has(product._id) ? 'Remove from wishlist' : 'Add to wishlist'" :aria-pressed="saved.has(product._id)" @click="saved.toggle(product._id, null, product)"
      >
        <Icon name="lucide:heart" class="w-4 h-4" :class="saved.has(product._id) ? 'text-sale fill-current' : 'text-ink'" />
      </button>
    </ClientOnly>
  </article>
</template>
