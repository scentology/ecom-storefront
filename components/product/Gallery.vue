<script setup>
// Product pictures in a portrait (4:5) white frame, contained with padding so square bottle shots and apparel both sit well;
// the main one zooms where the pointer is; clicking opens a full screen viewer (arrows, Esc).
const props = defineProps({ pics: { type: Array, default: () => [] }, title: String, badge: String })
const active = defineModel({ type: Number, default: 0 })
const zoom = reactive({ on: false, x: 50, y: 50 })
const move = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  zoom.x = ((e.clientX - r.left) / r.width) * 100
  zoom.y = ((e.clientY - r.top) / r.height) * 100
}
const viewer = ref(false)
useScrollLock(viewer)
const go = (d) => { active.value = (active.value + d + props.pics.length) % props.pics.length }
const onKey = (e) => {
  if (!viewer.value) return
  if (e.key === 'Escape') viewer.value = false
  if (e.key === 'ArrowRight') go(1)
  if (e.key === 'ArrowLeft') go(-1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div>
    <button
      type="button" class="relative block w-full aspect-[4/5] rounded-3xl overflow-hidden bg-white ring-1 ring-line cursor-zoom-in"
      :aria-label="`View ${title} full screen`" @mouseenter="zoom.on = true" @mouseleave="zoom.on = false" @mousemove="move" @click="viewer = true"
    >
      <Transition mode="out-in" enter-from-class="opacity-0" enter-active-class="transition-opacity duration-300" leave-to-class="opacity-0" leave-active-class="transition-opacity duration-150">
        <img v-if="pics[active]" :key="pics[active]" :src="pics[active]" :alt="title" class="w-full h-full object-contain p-8 sm:p-12 transition-transform duration-200" :style="zoom.on ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : {}">
      </Transition>
      <span v-if="badge" class="absolute left-4 top-4 rounded-full bg-sale text-white text-xs font-bold px-3 py-1">{{ badge }}</span>
      <span class="absolute right-4 bottom-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-card"><Icon name="lucide:expand" class="w-4 h-4" /></span>
    </button>
    <div v-if="pics.length > 1" class="flex gap-3 mt-4 overflow-x-auto s-no-scrollbar">
      <button v-for="(img, i) in pics" :key="img" class="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-white ring-2 transition" :class="active === i ? 'ring-noir-800' : 'ring-transparent opacity-70 hover:opacity-100'" :aria-label="`Picture ${i + 1}`" @click="active = i">
        <img :src="img" alt="" class="w-full h-full object-contain p-2" loading="lazy">
      </button>
    </div>

    <Teleport to="body">
      <Transition enter-from-class="opacity-0" enter-active-class="transition duration-200" leave-to-class="opacity-0" leave-active-class="transition duration-150">
        <div v-if="viewer" class="fixed inset-0 z-[65] bg-noir-950/95 flex items-center justify-center" role="dialog" aria-modal="true" :aria-label="title" @click.self="viewer = false">
          <img :src="pics[active]" :alt="title" class="max-h-[88vh] max-w-[92vw] object-contain rounded-2xl bg-white p-6">
          <button class="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 text-cream flex items-center justify-center hover:bg-white/20" aria-label="Close" @click="viewer = false"><Icon name="lucide:x" class="w-5 h-5" /></button>
          <template v-if="pics.length > 1">
            <button class="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 text-cream flex items-center justify-center hover:bg-white/20" aria-label="Previous picture" @click="go(-1)"><Icon name="lucide:chevron-left" class="w-6 h-6" /></button>
            <button class="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 text-cream flex items-center justify-center hover:bg-white/20" aria-label="Next picture" @click="go(1)"><Icon name="lucide:chevron-right" class="w-6 h-6" /></button>
            <p class="absolute bottom-6 text-cream/70 text-sm tabular-nums">{{ active + 1 }} / {{ pics.length }}</p>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
