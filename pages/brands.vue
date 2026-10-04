<script setup>
// Every brand, A–Z, with its logo and how many products it has; a letter bar to jump.
const { data: brands } = await useBrands()
const q = ref('')
const letter = ref('')
const list = computed(() => brands.value
  .filter((b) => b.products > 0)
  .filter((b) => !q.value.trim() || b.name.toLowerCase().includes(q.value.trim().toLowerCase()))
  .filter((b) => !letter.value || b.name.toUpperCase().startsWith(letter.value))
  .sort((a, b) => a.name.localeCompare(b.name)))
const letters = computed(() => [...new Set(brands.value.filter((b) => b.products > 0).map((b) => b.name[0].toUpperCase()))].sort())
const featured = computed(() => brands.value.filter((b) => b.featured && b.products > 0))
useSeoMeta({ title: 'Brands', description: 'The brands and labels we carry, from fragrance houses to our own menswear.' })
</script>

<template>
  <div>
    <UiPageHero eyebrow="The houses" title="Brands & labels" :note="`${brands.filter((b) => b.products > 0).length} brands and labels, each with a story of its own`" />

    <div class="s-container py-12">
      <div v-if="featured.length" class="mb-12">
        <p class="text-[0.7rem] tracking-[0.22em] uppercase text-ink-faint mb-4">Top brands</p>
        <div class="flex flex-wrap gap-2">
          <NuxtLink v-for="b in featured" :key="b._id" :to="`/products?brand=${b.slug}`" class="s-chip">{{ b.name }}</NuxtLink>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 sm:items-center mb-8">
        <input v-model="q" class="s-input sm:!w-80" placeholder="Find a brand" aria-label="Find a brand">
        <div class="flex flex-wrap gap-1">
          <button class="w-8 h-8 rounded-full text-sm" :class="!letter ? 'bg-noir-900 text-gold-light' : 'hover:bg-cream-deep'" @click="letter = ''">All</button>
          <button v-for="l in letters" :key="l" class="w-8 h-8 rounded-full text-sm" :class="letter === l ? 'bg-noir-900 text-gold-light' : 'hover:bg-cream-deep'" @click="letter = letter === l ? '' : l">{{ l }}</button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <NuxtLink v-for="b in list" :key="b._id" :to="`/products?brand=${b.slug}`" class="group rounded-2xl bg-white ring-1 ring-line overflow-hidden hover:shadow-lift transition">
          <div class="aspect-[2/1] bg-white flex items-center justify-center p-6 border-b border-line">
            <img v-if="b.logo" :src="b.logo" :alt="b.name" class="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy">
            <span v-else class="font-display text-2xl text-noir-800">{{ b.name }}</span>
          </div>
          <div class="px-5 py-4 flex items-center justify-between gap-3">
            <span><span class="block font-display text-lg text-noir-800">{{ b.name }}</span><span class="block text-xs text-ink-faint">{{ b.products }} {{ b.products === 1 ? 'product' : 'products' }}</span></span>
            <Icon name="lucide:arrow-right" class="w-4 h-4 text-ink-faint transition group-hover:translate-x-1 group-hover:text-noir-800" />
          </div>
        </NuxtLink>
      </div>
      <p v-if="!list.length" class="text-center py-16 text-ink-soft">No brand matches.</p>
    </div>
  </div>
</template>
