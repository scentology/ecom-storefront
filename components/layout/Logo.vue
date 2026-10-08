<script setup>
// Scentology.BD logo: the S-and-bottle emblem with the wordmark and tagline (the client's artwork, redrawn at high
// resolution). public/logo.png is gold on transparent for dark grounds (light); public/logo-dark.png for light grounds.
defineProps({ light: Boolean, stacked: Boolean })
const shop = useShop()
</script>
<template>
  <NuxtLink to="/" class="inline-flex items-center group" :aria-label="`${shop.name} home`">
    <img :src="light ? '/logo.png' : '/logo-dark.png'" :alt="shop.name" width="1200" height="321"
      class="w-auto shrink-0 select-none" :class="stacked ? 'h-16 sm:h-20' : 'h-9 sm:h-11'" draggable="false">
  </NuxtLink>
</template>
