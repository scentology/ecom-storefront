<script setup>
// Scentology mark: a gold double ring around a Cinzel "S" monogram, with diamond ornaments north and south.
// Name and tagline come from the shop details (useShop). Swap for /logo.png (or /logo.svg) in public/ when
// the real artwork is added.
defineProps({ light: Boolean, stacked: Boolean })
const shop = useShop()
const initial = computed(() => (shop.value.name || 'S').trim().charAt(0).toUpperCase())
</script>
<template>
  <NuxtLink to="/" class="inline-flex items-center gap-3 group" :class="{ 'flex-col !gap-2': stacked }" :aria-label="`${shop.name} home`">
    <svg viewBox="0 0 48 48" class="shrink-0" :class="stacked ? 'w-16 h-16' : 'w-8 h-8 sm:w-10 sm:h-10'" aria-hidden="true">
      <defs>
        <linearGradient id="sc-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F1DDA8" /><stop offset=".45" stop-color="#C9A24E" /><stop offset="1" stop-color="#8C6A2F" />
        </linearGradient>
      </defs>
      <!-- outer ring, broken north and south for the ornaments -->
      <path d="M21.2 2.7A21.4 21.4 0 0 0 21.2 45.3M26.8 45.3A21.4 21.4 0 0 0 26.8 2.7" fill="none" stroke="url(#sc-gold)" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="url(#sc-gold)" stroke-width=".6" opacity=".7" />
      <path d="M24 .6 25.9 2.6 24 4.6 22.1 2.6Z M24 43.4 25.9 45.4 24 47.4 22.1 45.4Z" fill="url(#sc-gold)" />
      <!-- monogram -->
      <text x="24" y="24" text-anchor="middle" dominant-baseline="central" fill="url(#sc-gold)" font-family="Cinzel, 'Cormorant Garamond', serif" font-size="21" font-weight="600">{{ initial }}</text>
      <path d="M15.5 33.6h17" stroke="url(#sc-gold)" stroke-width=".6" opacity=".7" />
    </svg>
    <span class="leading-none" :class="{ 'text-center': stacked }">
      <span class="block font-brand uppercase" :class="[stacked ? 'text-3xl tracking-[0.2em]' : 'text-[1.02rem] tracking-[0.14em] sm:text-[1.35rem] sm:tracking-[0.2em]', light ? 's-gold-text' : 'text-noir-900']">{{ shop.name }}</span>
      <span v-if="shop.tagline" class="font-display italic text-[0.8rem] tracking-[0.18em] mt-1" :class="[stacked ? 'block' : 'hidden sm:block', light ? 'text-gold-light/80' : 'text-ink-soft']">{{ shop.tagline }}</span>
    </span>
  </NuxtLink>
</template>
