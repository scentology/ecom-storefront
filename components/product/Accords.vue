<script setup>
// A fragrance's main accords as coloured bars, strongest first: each bar is as long as the accord is strong.
const props = defineProps({ accords: { type: Array, default: () => [] } })

const list = computed(() => [...props.accords].filter((a) => a?.name).sort((a, b) => b.percent - a.percent))
// dark or light text for a bar of this colour (WCAG relative luminance)
const ink = (hex) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '')
  if (!m) return '#1a1a1a'
  const [r, g, b] = m.slice(1).map((h) => { const c = parseInt(h, 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#1a1a1a' : '#ffffff'
}
</script>

<template>
  <ul v-if="list.length" class="space-y-0.5" aria-label="Main accords, strongest first">
    <li
      v-for="a in list" :key="a.name"
      class="accord h-6 flex items-center justify-center px-2.5 text-xs leading-none whitespace-nowrap overflow-hidden rounded-r-md"
      :style="{ width: Math.max(a.percent, 24) + '%', background: a.colour, color: ink(a.colour) }"
      :title="`${a.name}: ${a.percent}%`"
    >
      {{ a.name }}
    </li>
  </ul>
</template>

<style scoped>
/* pale bars (white floral, vanilla) need an edge on the ivory ground */
.accord { box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06); }
</style>
