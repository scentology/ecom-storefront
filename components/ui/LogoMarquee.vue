<script setup>
// Logos drifting sideways forever (the list is doubled so it loops); pauses on hover.
defineProps({ logos: { type: Array, default: () => [] }, speed: { type: Number, default: 45 }, tile: Boolean }) // [{ src, alt, to }]; tile: each on a white card
</script>

<template>
  <div class="relative overflow-hidden s-marquee-mask group" role="list">
    <div class="flex w-max gap-14 animate-marquee group-hover:[animation-play-state:paused]" :style="{ animationDuration: `${speed}s` }">
      <template v-for="round in 2" :key="round">
        <NuxtLink v-for="(l, i) in logos" :key="`${round}-${i}`" :to="l.to" class="shrink-0 flex items-center transition" :class="tile ? 'h-20 w-48 rounded-xl bg-white overflow-hidden opacity-90 hover:opacity-100 hover:-translate-y-0.5' : 'h-14 opacity-70 hover:opacity-100'" role="listitem" :aria-hidden="round === 2">
          <img :src="l.src" :alt="l.alt" :class="tile ? 'w-full h-full object-contain scale-[1.22] px-1' : 'h-full w-auto object-contain'" loading="lazy">
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
