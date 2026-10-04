<script setup>
// One product at a time: an arched portrait picture (bottles and apparel alike), its brand, name, a few lines,
// the price and what it comes in (each option's values: "S, M, L · Navy, Black", or the variants).
const props = defineProps({ section: { type: Object, required: true } })
const sizes = (p) => (p.options?.length ? p.options.map((o) => (o.values || []).join(', ')).filter(Boolean).join(' · ')
  : (p.variants || []).map((v) => Object.values(v.attributes || {}).join(' ')).filter(Boolean).join(', '))
</script>

<template>
  <section class="s-container py-20">
    <div v-reveal="'zoom'" class="s-band rounded-[2rem] text-cream px-6 sm:px-14 py-14 overflow-hidden relative">
      <span class="s-orbit w-[40rem] h-[40rem] -right-60 -top-72" aria-hidden="true" />
      <h2 class="s-title text-3xl sm:text-[2.8rem] text-center relative">{{ section.title }} <em v-if="section.highlight" class="font-display italic s-gold-text">{{ section.highlight }}</em></h2>
      <div class="mt-12 relative">
        <UiCarousel :items="section.products" :autoplay="5500" dark item-class="w-full" label="Curated for you">
          <template #item="{ item: p }">
            <div class="grid md:grid-cols-2 gap-10 items-center px-1">
              <NuxtLink :to="productUrl(p)" class="mx-auto w-full max-w-sm">
                <span class="block rounded-t-full ring-1 ring-gold/40 p-2">
                  <span class="block aspect-[4/5] rounded-t-full overflow-hidden bg-white">
                    <img v-if="imagesOf(p)[0]" :src="imagesOf(p)[0]" :alt="p.title" class="w-full h-full object-cover object-top" loading="lazy">
                  </span>
                </span>
              </NuxtLink>
              <div class="text-center">
                <p class="text-xs tracking-[0.2em] uppercase text-gold">{{ p.brand?.name || (p.is_combo ? 'Combo' : '') }}</p>
                <h3 class="font-display text-4xl sm:text-5xl mt-3 leading-tight">{{ p.title }}</h3>
                <p class="mt-5 text-cream/70 text-sm leading-relaxed line-clamp-3 max-w-md mx-auto">{{ p.description }}</p>
                <p class="mt-6 tabular-nums"><span v-if="priceOf(p).max > priceOf(p).min" class="text-cream/60 text-sm mr-2">From</span><span class="text-2xl font-semibold">{{ money(priceOf(p).min) }}</span></p>
                <p v-if="sizes(p)" class="text-xs text-cream/50 mt-1">Available in {{ sizes(p) }}</p>
                <NuxtLink :to="productUrl(p)" class="s-btn-gold mt-7">View</NuxtLink>
              </div>
            </div>
          </template>
        </UiCarousel>
      </div>
    </div>
  </section>
</template>
