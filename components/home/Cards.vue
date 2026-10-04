<script setup>
// Picture cards: three (e.g. categories or audiences: the last one wide when dark), four (two by two) or three equal.
const props = defineProps({ section: { type: Object, required: true } })
const links = computed(() => props.section.links || [])
const wideLast = computed(() => links.value.length === 3 && props.section.dark)
const grid = computed(() => (links.value.length === 4 ? 'sm:grid-cols-2' : wideLast.value ? 'sm:grid-cols-4' : 'sm:grid-cols-3'))
</script>

<template>
  <section class="py-20" :class="section.dark ? 's-band text-cream' : ''">
    <div class="s-container">
      <div v-reveal :class="section.dark ? 'text-center' : ''">
        <h2 class="s-title text-3xl sm:text-[2.8rem] leading-tight" :class="section.dark ? '' : 'text-noir-800'">{{ section.title }} <em v-if="section.highlight" class="font-display italic" :class="section.dark ? 's-gold-text block' : 'text-gold-dark'">{{ section.highlight }}</em></h2>
        <p v-if="section.subtitle" class="mt-3 text-sm" :class="section.dark ? 'text-cream/70' : 'text-ink-soft'">{{ section.subtitle }}</p>
      </div>
      <div class="grid gap-4 mt-12" :class="grid">
        <NuxtLink
          v-for="(l, i) in links" :key="i" v-reveal="{ dir: 'up', delay: i * 90 }" :to="l.href"
          class="group relative block overflow-hidden rounded-3xl bg-noir-800" :class="[wideLast && i === 2 ? 'sm:col-span-2' : '', links.length === 4 ? 'aspect-[16/10]' : section.dark ? 'aspect-[4/5] sm:aspect-auto sm:min-h-[26rem]' : 'aspect-[4/5]']"
        >
          <img v-if="l.display_image" :src="l.display_image" :alt="l.display_label" loading="lazy" class="absolute inset-0 w-full h-full object-cover transition duration-[1.2s] group-hover:scale-105">
          <span class="absolute inset-0 bg-gradient-to-t from-noir-950/85 via-noir-950/20 to-transparent" />
          <span class="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between gap-4 text-cream">
            <span>
              <span class="block font-display text-3xl">{{ l.display_label }}</span>
              <span v-if="l.display_subtitle" class="block text-sm text-cream/75 mt-1">{{ l.display_subtitle }}</span>
              <span class="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-gold-light">Shop now <Icon name="lucide:arrow-right" class="w-4 h-4 transition group-hover:translate-x-1" /></span>
            </span>
            <span class="w-11 h-11 rounded-full bg-gold-light text-noir-900 flex items-center justify-center shrink-0 transition duration-500 group-hover:rotate-45"><Icon name="lucide:arrow-up-right" class="w-5 h-5" /></span>
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
