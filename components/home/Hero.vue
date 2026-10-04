<script setup>
// The home carousel, built for campaigns and deals. Each slide: a wide picture (and an optional portrait one for
// phones), text placed left / centre / right in light or dark, a deal tag with an optional countdown, up to two
// buttons, or picture only (a ready-made banner, the whole slide is the link). A strip of labelled tabs shows
// what's next and how long until it turns; swipe on phones, arrow keys on desktop, pauses on hover / focus.
import { NuxtLink } from '#components'

const props = defineProps({ section: { type: Object, required: true } })
const slides = computed(() => props.section.slides || [])
const at = ref(0)
const DWELL = 7000
const tick = ref(0)
const hovered = ref(false)
const focused = ref(false)
const hidden = ref(false)
const reduced = ref(false)
const paused = computed(() => hovered.value || focused.value || hidden.value || reduced.value)
let timer

const go = (i) => { at.value = (i + slides.value.length) % slides.value.length }
const schedule = () => {
  clearTimeout(timer)
  tick.value++
  if (slides.value.length < 2 || paused.value) return
  timer = setTimeout(() => go(at.value + 1), DWELL)
}
watch([at, paused], schedule)

// deal countdowns, refreshed every 30s
const now = ref(Date.now())
let clock
const left = (s) => {
  if (!s.ends_at) return ''
  const ms = new Date(s.ends_at).getTime() - now.value
  if (ms <= 0) return 'Ended'
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4)
  return d > 0 ? `Ends in ${d}d ${h}h` : h > 0 ? `Ends in ${h}h ${m}m` : `Ends in ${m}m`
}

const onVisibility = () => { hidden.value = document.hidden }
onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.addEventListener('visibilitychange', onVisibility)
  clock = setInterval(() => { now.value = Date.now() }, 30000)
  schedule()
})
onBeforeUnmount(() => { clearTimeout(timer); clearInterval(clock); document.removeEventListener('visibilitychange', onVisibility) })

// swipe
let x0 = null
const touchStart = (e) => { x0 = e.touches[0].clientX }
const touchEnd = (e) => {
  if (x0 === null) return
  const dx = e.changedTouches[0].clientX - x0
  if (Math.abs(dx) > 40) go(at.value + (dx < 0 ? 1 : -1))
  x0 = null
}
const onKey = (e) => {
  if (e.key === 'ArrowRight') go(at.value + 1)
  if (e.key === 'ArrowLeft') go(at.value - 1)
}

const FOCUS = { top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center', center: 'center' }
const objectPos = (s) => FOCUS[s.focus] || 'center'
const label = (s, i) => s.label || s.eyebrow || s.title || `Slide ${i + 1}`
const light = (s) => s.theme === 'light'
const align = (s) => s.align || 'left'
// the wash sits behind the text: from its side on wide screens, from the bottom on phones
const wash = (s) => {
  const tone = light(s) ? '247 243 236' : '10 9 8'
  const side = { left: 'to right', right: 'to left', center: 'to top' }[align(s)]
  return {
    '--wash-m': `linear-gradient(to top, rgb(${tone} / .95) 0%, rgb(${tone} / .75) 40%, rgb(${tone} / 0) 72%)`,
    '--wash-d': align(s) === 'center'
      ? `radial-gradient(70% 80% at 50% 55%, rgb(${tone} / .7), rgb(${tone} / .15) 70%, rgb(${tone} / 0))`
      : `linear-gradient(${side}, rgb(${tone} / .92) 0%, rgb(${tone} / .78) 30%, rgb(${tone} / .35) 55%, rgb(${tone} / 0) 78%)`,
  }
}
</script>

<template>
  <section
    v-if="slides.length" class="relative bg-noir-950 text-cream" aria-roledescription="carousel" aria-label="Featured"
    @mouseenter="hovered = true" @mouseleave="hovered = false" @focusin="focused = true" @focusout="focused = false" @keydown="onKey"
  >
    <div class="relative overflow-hidden aspect-[4/5] max-h-[82svh] sm:aspect-[16/11] md:aspect-auto md:h-[min(80svh,44vw)] md:min-h-[28rem] md:max-h-none" @touchstart.passive="touchStart" @touchend="touchEnd">
      <TransitionGroup enter-from-class="opacity-0" enter-active-class="transition-opacity duration-700 ease-out" leave-to-class="opacity-0" leave-active-class="transition-opacity duration-700 ease-in">
        <div v-for="(s, i) in slides" v-show="i === at" :key="i" class="absolute inset-0" role="group" aria-roledescription="slide" :aria-label="`${i + 1} of ${slides.length}: ${label(s, i)}`" :aria-hidden="i !== at">
          <component :is="s.text_off && s.button ? NuxtLink : 'div'" :to="s.text_off && s.button ? s.button.href : undefined" class="absolute inset-0 block" :aria-label="s.text_off ? (s.title || label(s, i)) : undefined">
            <picture v-if="s.image || s.mobile_image">
              <source v-if="s.image && s.mobile_image" media="(min-width: 640px)" :srcset="s.image">
              <img
                :src="s.mobile_image || s.image" :alt="s.text_off ? (s.title || label(s, i)) : ''" class="absolute inset-0 w-full h-full object-cover"
                :class="{ 's-kenburns': i === at && !reduced && !s.text_off }" :style="{ objectPosition: objectPos(s) }"
                :loading="i === 0 ? 'eager' : 'lazy'" :fetchpriority="i === 0 ? 'high' : undefined"
              >
            </picture>
            <span v-else class="absolute inset-0 s-band" />
          </component>

          <template v-if="!s.text_off">
            <span class="hero-wash absolute inset-0 pointer-events-none" :style="wash(s)" />
            <div class="relative s-container h-full flex pb-8 sm:pb-12 md:pb-20" :class="[
              'items-end md:items-center',
              { left: 'justify-start', center: 'justify-center text-center', right: 'justify-end' }[align(s)],
              light(s) ? 'text-noir-900' : 'text-cream',
            ]">
              <div v-if="i === at" class="w-full max-w-[34rem]" :class="align(s) === 'center' ? 'mx-auto' : ''">
                <div v-if="s.badge || s.ends_at" class="flex flex-wrap items-center gap-2 mb-4 animate-rise" :class="align(s) === 'center' ? 'justify-center' : ''">
                  <span v-if="s.badge" class="inline-flex items-center rounded-full bg-gold px-3.5 py-1.5 text-[0.8rem] font-semibold text-noir-950">{{ s.badge }}</span>
                  <ClientOnly><span v-if="s.ends_at" class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] font-medium tabular-nums" :class="light(s) ? 'bg-noir-900/10' : 'bg-white/15 backdrop-blur'"><Icon name="lucide:timer" class="w-3.5 h-3.5" />{{ left(s) }}</span></ClientOnly>
                </div>
                <p v-if="s.eyebrow" class="text-sm font-medium animate-rise" :class="light(s) ? 'text-gold-deep' : 'text-gold-light'">{{ s.eyebrow }}</p>
                <h2 class="s-title text-[2.6rem] sm:text-6xl xl:text-[4.25rem] leading-[1.02] mt-2 animate-rise [animation-delay:80ms]">
                  {{ s.title }}<em v-if="s.highlight" class="font-display italic block" :class="light(s) ? 'text-gold-deep' : 's-gold-text'">{{ s.highlight }}</em>
                </h2>
                <p v-if="s.body" class="mt-4 sm:mt-5 text-[0.95rem] sm:text-base leading-relaxed max-w-md animate-rise [animation-delay:160ms]" :class="[light(s) ? 'text-noir-800/80' : 'text-cream/80', align(s) === 'center' ? 'mx-auto' : '']">{{ s.body }}</p>
                <div v-if="s.button || s.button2" class="mt-6 sm:mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:240ms]" :class="align(s) === 'center' ? 'justify-center' : ''">
                  <NuxtLink v-if="s.button" :to="s.button.href" class="s-btn-gold">{{ s.button.display_label }} <Icon name="lucide:arrow-right" class="w-4 h-4" /></NuxtLink>
                  <NuxtLink v-if="s.button2" :to="s.button2.href" class="s-btn-ghost" :class="light(s) ? 'text-noir-900 hover:bg-noir-900/5' : 'text-cream'">{{ s.button2.display_label }}</NuxtLink>
                </div>
              </div>
            </div>
          </template>
        </div>
      </TransitionGroup>

      <template v-if="slides.length > 1">
        <button class="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-noir-950/40 text-cream backdrop-blur hover:bg-noir-950/70 transition-colors" aria-label="Previous slide" @click="go(at - 1)"><Icon name="lucide:chevron-left" class="w-5 h-5" /></button>
        <button class="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-noir-950/40 text-cream backdrop-blur hover:bg-noir-950/70 transition-colors" aria-label="Next slide" @click="go(at + 1)"><Icon name="lucide:chevron-right" class="w-5 h-5" /></button>
      </template>
    </div>

    <!-- the tab strip: what each slide is, which is on, time to the next -->
    <div v-if="slides.length > 1" class="bg-noir-950 md:bg-transparent md:bg-gradient-to-t md:from-noir-950/85 md:via-noir-950/40 md:to-transparent md:absolute md:inset-x-0 md:bottom-0 md:pt-10">
      <div class="s-container">
        <div class="flex gap-3 md:gap-5 overflow-x-auto s-no-scrollbar py-3 md:py-5" role="tablist" aria-label="Slides">
          <button
            v-for="(s, i) in slides" :key="i" role="tab" :aria-selected="i === at" class="group min-w-[7.5rem] flex-1 text-left"
            @click="go(i)"
          >
            <span class="relative block h-[3px] rounded-full overflow-hidden" :class="i === at ? 'bg-cream/25' : 'bg-cream/15 group-hover:bg-cream/30'">
              <span v-if="i === at" :key="tick" class="absolute inset-0 origin-left bg-gold rounded-full" :class="paused || reduced ? '' : 's-fill'" :style="{ animationDuration: `${DWELL}ms` }" />
              <span v-else-if="i < at" class="absolute inset-0 bg-cream/40 rounded-full" />
            </span>
            <span class="mt-2 block truncate text-[0.8rem] transition-colors" :class="i === at ? 'text-cream' : 'text-cream/55 group-hover:text-cream/85'">{{ label(s, i) }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-wash { background: var(--wash-m); }
@media (min-width: 768px) {
  .hero-wash { background: var(--wash-d); }
}
</style>
