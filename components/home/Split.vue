<script setup>
// Picture and headline. The picture keeps its own shape in a frame (4:5 on wide screens, 4:3 on phones) instead of
// being stretched over half the screen, so products in it stay whole; `focus` picks the part kept in view and
// `image_left` swaps the sides.
const props = defineProps({ section: { type: Object, required: true } })
const FOCUS = { top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center', center: 'center' }
const pos = computed(() => FOCUS[props.section.focus] || 'center')
</script>

<template>
  <section class="py-14 sm:py-20 lg:py-28" :class="section.dark ? 's-band text-cream' : 'bg-cream'">
    <div class="s-container grid items-center gap-10 md:grid-cols-2 lg:gap-20">
      <div v-reveal="section.image_left ? 'right' : 'left'" :class="section.image_left ? 'md:order-2' : ''">
        <div class="max-w-[32rem]" :class="section.image_left ? 'md:ml-auto' : ''">
          <p v-if="section.eyebrow" class="text-sm font-medium" :class="section.dark ? 'text-gold-light' : 'text-gold-deep'">{{ section.eyebrow }}</p>
          <h2 class="s-title text-4xl sm:text-5xl xl:text-6xl leading-[1.05] mt-2">
            {{ section.title }}<em v-if="section.highlight" class="font-display italic block" :class="section.dark ? 'text-gold-light' : 'text-gold-deep'">{{ section.highlight }}</em>
          </h2>
          <p v-if="section.subtitle" class="mt-4 font-display text-2xl sm:text-[1.7rem] leading-snug" :class="section.dark ? 'text-cream/85' : 'text-noir-800'">{{ section.subtitle }}</p>
          <p v-if="section.body" class="mt-5 leading-relaxed max-w-md" :class="section.dark ? 'text-cream/70' : 'text-ink-soft'">{{ section.body }}</p>
          <NuxtLink v-if="section.button" :to="section.button.href" class="s-btn-gold mt-8">{{ section.button.display_label }} <Icon name="lucide:arrow-right" class="w-4 h-4" /></NuxtLink>
        </div>
      </div>
      <div v-reveal="section.image_left ? 'left' : 'right'" :class="section.image_left ? 'md:order-1' : ''">
        <div v-if="section.image" class="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden rounded-[2rem]" :class="section.dark ? 'ring-1 ring-gold/25' : 'shadow-lift'">
          <img :src="section.image" alt="" class="absolute inset-0 w-full h-full object-cover" :style="{ objectPosition: pos }" loading="lazy">
        </div>
      </div>
    </div>
  </section>
</template>
