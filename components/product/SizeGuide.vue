<script setup>
// Size guide drawer: the category's size chart (columns, rows, note), the chosen size highlighted.
const props = defineProps({ chart: { type: Object, default: null }, title: String, current: String })
const open = defineModel({ type: Boolean, default: false })
useScrollLock(open)
const onKey = (e) => { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
const isCurrent = (row) => props.current && String(row[0]).toLowerCase() === String(props.current).toLowerCase()
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" enter-active-class="transition" leave-to-class="opacity-0" leave-active-class="transition">
      <div v-if="open && chart" class="fixed inset-0 z-50 bg-noir-950/50" @click.self="open = false">
        <aside class="absolute right-0 top-0 h-full w-[min(32rem,100vw)] bg-cream flex flex-col shadow-lift" role="dialog" aria-modal="true" aria-label="Size guide">
          <header class="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
            <div>
              <p class="s-eyebrow text-gold-dark">Size guide</p>
              <h2 class="font-display text-2xl text-noir-800 mt-1">{{ title || 'Find your fit' }}</h2>
            </div>
            <button class="p-2 -mr-2" aria-label="Close size guide" @click="open = false"><Icon name="lucide:x" class="w-6 h-6" /></button>
          </header>
          <div class="flex-1 overflow-y-auto px-6 py-6" data-lenis-prevent>
            <div class="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
              <table class="w-full text-sm tabular-nums">
                <thead>
                  <tr class="bg-noir-900 text-gold-light">
                    <th v-for="c in chart.columns" :key="c" scope="col" class="px-4 py-3 text-left font-semibold whitespace-nowrap first:pl-5">{{ c }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr v-for="(row, i) in chart.rows" :key="i" :class="isCurrent(row) ? 'bg-gold/15' : i % 2 ? 'bg-cream/50' : ''">
                    <td v-for="(cell, j) in row" :key="j" class="px-4 py-3 whitespace-nowrap first:pl-5" :class="j === 0 ? 'font-semibold text-noir-800' : 'text-ink-soft'">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="chart.note" class="mt-5 flex gap-2.5 text-sm text-ink-soft leading-relaxed"><Icon name="lucide:ruler" class="w-4 h-4 mt-0.5 text-gold-dark shrink-0" />{{ chart.note }}</p>
            <p class="mt-6 text-xs text-ink-faint">Still unsure? Message us with your height and usual size and we'll help you choose.</p>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
