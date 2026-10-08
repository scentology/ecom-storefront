<script setup>
defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <section class="s-band text-cream py-20 overflow-hidden">
    <div class="s-container grid lg:grid-cols-[minmax(0,26rem)_1fr] gap-12 items-center">
      <div v-reveal="'left'">
        <span v-if="section.eyebrow" class="inline-block rounded-full border border-white/20 px-4 py-1.5 text-[0.7rem] tracking-[0.18em] uppercase text-cream/80">{{ section.eyebrow }}</span>
        <h2 class="s-title text-4xl sm:text-5xl leading-tight mt-5">{{ section.title }} <em v-if="section.highlight" class="font-display italic s-gold-text block">{{ section.highlight }}</em></h2>
        <span class="s-rule mt-6" />
        <dl v-if="section.figures?.length" class="grid grid-cols-3 gap-4 mt-8">
          <div v-for="f in section.figures" :key="f.key"><dt class="sr-only">{{ f.label }}</dt><dd class="text-3xl font-semibold text-gold-light tabular-nums">{{ f.value }}</dd><p class="text-[0.68rem] tracking-[0.14em] uppercase text-cream/60 mt-1">{{ f.label }}</p></div>
        </dl>
        <NuxtLink v-if="section.button" :to="section.button.href" class="s-btn-gold mt-9">{{ section.button.display_label }} <Icon name="lucide:arrow-right" class="w-4 h-4" /></NuxtLink>
      </div>
      <div v-reveal="'right'" class="min-w-0">
        <UiCarousel :items="section.products" :autoplay="4200" dark item-class="w-[78%] sm:w-[46%] xl:w-[40%]" label="Combos">
          <template #item="{ item: p, active }">
            <NuxtLink :to="productUrl(p)" class="group block rounded-3xl bg-white/5 ring-1 p-4 transition duration-500" :class="active ? 'ring-gold/50 bg-white/10' : 'ring-white/10 opacity-75'">
              <div class="relative aspect-square rounded-2xl overflow-hidden bg-white">
                <img v-if="imagesOf(p)[0]" :src="imagesOf(p)[0]" :alt="p.title" class="w-full h-full object-contain p-4 transition duration-700 group-hover:scale-105" loading="lazy">
                <span v-if="comboSaving(p)" class="absolute left-3 top-3 rounded-full bg-gold-light text-noir-900 text-[0.68rem] font-bold uppercase tracking-wide px-2.5 py-1">Save up to {{ money(comboSaving(p)) }}</span>
              </div>
              <p class="text-center mt-4 text-[0.65rem] tracking-[0.2em] uppercase text-cream/50">Combo</p>
              <p class="text-center mt-1 font-display text-xl">{{ p.title }}</p>
              <p class="text-center mt-1 text-sm tabular-nums"><span class="text-gold-light font-semibold">{{ money(priceOf(p).min) }}</span> <s v-if="priceOf(p).was" class="text-cream/45 ml-1">{{ money(priceOf(p).was) }}</s></p>
            </NuxtLink>
          </template>
        </UiCarousel>
      </div>
    </div>
  </section>
</template>
