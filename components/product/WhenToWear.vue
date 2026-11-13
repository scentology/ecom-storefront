<script setup>
// When to wear: each season and day / night as an icon over a coloured bar, as long as the scent suits it.
// No numbers: the bars are read against each other.
const props = defineProps({ ratings: { type: Array, default: () => [] } })

const SHOWN = [
  { key: 'winter', label: 'Winter', icon: 'lucide:snowflake' },
  { key: 'spring', label: 'Spring', icon: 'lucide:flower-2' },
  { key: 'summer', label: 'Summer', icon: 'lucide:umbrella' },
  { key: 'fall', label: 'Fall', icon: 'lucide:leaf' },
  { key: 'day', label: 'Day', icon: 'lucide:sun' },
  { key: 'night', label: 'Night', icon: 'lucide:moon-star' },
]
const list = computed(() => SHOWN.map((s) => {
  const r = props.ratings.find((x) => x?.key === s.key)
  return { ...s, colour: r?.colour || '#c8c2b4', percent: Math.min(100, Math.max(0, Number(r?.percent) || 0)) }
}))
const level = (p) => (p >= 75 ? 'a great fit' : p >= 45 ? 'a good fit' : p >= 15 ? 'an occasional fit' : 'rarely worn')
</script>

<template>
  <ul class="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-6">
    <li v-for="w in list" :key="w.key" class="text-center min-w-0">
      <Icon :name="w.icon" class="w-7 h-7 text-noir-800 mx-auto" aria-hidden="true" />
      <span class="block text-xs font-semibold mt-2">{{ w.label }}</span>
      <span class="block h-1.5 mt-2 rounded-full bg-line overflow-hidden" role="img" :aria-label="`${w.label}: ${level(w.percent)}`">
        <span class="block h-full rounded-full" :style="{ width: w.percent + '%', background: w.colour }" />
      </span>
    </li>
  </ul>
</template>
