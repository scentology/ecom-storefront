<script setup>
// One dropdown of the main menu: columns of links, chips, picture cards or the top brands.
const props = defineProps({ item: { type: Object, required: true } })
const total = computed(() => Math.min(6, props.item.columns.reduce((n, c) => n + (c.span || 1), 0)))
const brandLinks = (c) => c.links.filter((l) => l.kind !== 'brands')
const allBrands = (c) => c.links.find((l) => l.kind === 'brands')
// picture cards: all in one row (up to four) in a wide column, stacked in a narrow one; one or two cards are
// portrait, three or four landscape so the panel stays short
const pictured = (c) => c.links.filter((l) => l.display_image).length || 1
const cardCols = (c) => ((c.span || 1) < 2 ? 1 : Math.min(pictured(c), 4))
const cardShape = (c) => ((c.span || 1) >= 2 && pictured(c) >= 3 ? 'aspect-[16/11]' : 'aspect-[4/5]')
</script>

<template>
  <div class="s-container py-10 grid gap-x-10 gap-y-8" :style="{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }">
    <div v-for="(c, ci) in item.columns" :key="ci" class="min-w-0 s-menu-col" :style="{ gridColumn: `span ${c.span || 1}`, animationDelay: `${ci * 45}ms` }">
      <p v-if="c.title" class="text-[0.7rem] tracking-[0.22em] uppercase text-ink-faint mb-4">{{ c.title }}</p>

      <!-- a list -->
      <ul v-if="c.kind === 'links'" class="space-y-1 -mx-3">
        <li v-for="(l, i) in c.links" :key="i">
          <NuxtLink :to="l.href" class="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.95rem] text-ink hover:bg-cream-deep/70 hover:text-noir-900 transition">
            <span class="flex items-center gap-2.5 min-w-0"><Icon v-if="l.display_icon" :name="l.display_icon" class="w-4 h-4 text-gold-dark shrink-0" /><span class="truncate">{{ l.display_label }}</span></span>
            <Icon name="lucide:arrow-right" class="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
          </NuxtLink>
        </li>
      </ul>

      <!-- pills -->
      <div v-else-if="c.kind === 'chips'" class="flex flex-wrap gap-2">
        <NuxtLink v-for="(l, i) in c.links" :key="i" :to="l.href" class="rounded-full border border-line-strong px-3.5 py-1.5 text-sm text-ink hover:border-noir-800 hover:bg-noir-900 hover:text-gold-light transition">{{ l.display_label }}</NuxtLink>
      </div>

      <!-- picture cards (values without a picture become small tiles) -->
      <div v-else-if="c.kind === 'cards'" class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${cardCols(c)}, minmax(0, 1fr))` }">
        <template v-for="(l, i) in c.links" :key="i">
          <NuxtLink v-if="l.display_image" :to="l.href" class="group relative block rounded-2xl overflow-hidden bg-noir-800" :class="cardShape(c)">
            <img :src="l.display_image" :alt="l.display_label" loading="lazy" class="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105">
            <span class="absolute inset-0 bg-gradient-to-t from-noir-950/85 via-noir-950/20 to-transparent" />
            <span class="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-cream">
              <span class="min-w-0"><span class="block font-display text-xl leading-tight">{{ l.display_label }}</span><span v-if="l.display_subtitle" class="block text-xs text-cream/75 truncate">{{ l.display_subtitle }}</span></span>
              <span class="w-9 h-9 rounded-full bg-gold-light text-noir-900 flex items-center justify-center shrink-0 transition group-hover:rotate-45"><Icon name="lucide:arrow-up-right" class="w-4 h-4" /></span>
            </span>
          </NuxtLink>
        </template>
        <div v-if="c.links.some((l) => !l.display_image)" class="col-span-full grid grid-cols-2 gap-3">
          <NuxtLink v-for="(l, i) in c.links.filter((x) => !x.display_image)" :key="`t${i}`" :to="l.href" class="flex items-center gap-3 rounded-xl bg-cream-deep/70 px-4 py-3 text-sm text-ink hover:bg-cream-deep transition">
            <Icon :name="l.display_icon || 'lucide:sparkles'" class="w-4 h-4 text-gold-dark" />{{ l.display_label }}
          </NuxtLink>
        </div>
      </div>

      <!-- top brands: logo tiles (the name when a brand has no logo) -->
      <div v-else-if="c.kind === 'brands'">
        <ul class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${Math.max(2, Math.min(6, (c.span || 1) * 2))}, minmax(0, 1fr))` }">
          <li v-for="(l, i) in brandLinks(c)" :key="i">
            <NuxtLink :to="l.href" class="group relative flex items-center justify-center h-20 rounded-xl overflow-hidden bg-cream/60 ring-1 ring-line hover:bg-white hover:ring-gold/60 hover:shadow-card transition" :title="l.display_label">
              <!-- logo files keep the mark in their middle third: scale it up to nearly fill the tile -->
              <img v-if="l.display_image" :src="l.display_image" :alt="l.display_label" loading="lazy" class="absolute inset-0 w-full h-full object-contain scale-[1.28] opacity-85 group-hover:opacity-100 transition">
              <span v-else class="text-sm text-ink text-center">{{ l.display_label }}</span>
            </NuxtLink>
          </li>
        </ul>
        <NuxtLink :to="allBrands(c)?.href || '/brands'" class="group inline-flex items-center gap-2 mt-6 text-sm font-semibold text-noir-800">
          {{ allBrands(c)?.display_label || 'View all brands' }} <Icon name="lucide:arrow-right" class="w-4 h-4 transition group-hover:translate-x-1" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
