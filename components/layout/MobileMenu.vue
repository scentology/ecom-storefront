<script setup>
// Phone menu: the main entries, each dropdown opening as its own level (back to return), then quick links.
const props = defineProps({ open: Boolean, menu: { type: Object, required: true } })
const emit = defineEmits(['close'])
const auth = useAuth()
useScrollLock(computed(() => props.open))
const level = ref(null) // the dropdown shown, or null for the top level
watch(() => props.open, (v) => { if (!v) setTimeout(() => (level.value = null), 250) })
const dropdowns = computed(() => props.menu.items || [])
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" enter-active-class="transition duration-200" leave-to-class="opacity-0" leave-active-class="transition duration-200">
      <div v-if="open" class="fixed inset-0 z-50 bg-noir-950/60" @click.self="emit('close')">
        <Transition appear enter-from-class="-translate-x-full" enter-active-class="transition duration-300 ease-out">
          <nav class="h-full w-[min(24rem,90vw)] bg-cream text-ink flex flex-col" aria-label="Mobile">
            <div class="flex items-center justify-between px-5 h-16 bg-noir-900 text-cream shrink-0">
              <button v-if="level" class="flex items-center gap-2 text-sm" @click="level = null"><Icon name="lucide:arrow-left" class="w-5 h-5" /> Back</button>
              <LayoutLogo v-else light />
              <button class="w-10 h-10 rounded-full border border-white/25 flex items-center justify-center" aria-label="Close menu" @click="emit('close')"><Icon name="lucide:x" class="w-5 h-5" /></button>
            </div>

            <div class="flex-1 overflow-y-auto overflow-x-hidden relative" data-lenis-prevent>
              <Transition mode="out-in" enter-from-class="opacity-0 translate-x-6" enter-active-class="transition duration-200" leave-to-class="opacity-0 -translate-x-6" leave-active-class="transition duration-150">
                <!-- top level -->
                <div v-if="!level" key="root" class="p-5">
                  <NuxtLink to="/products?sort=new" class="flex items-center gap-3 rounded-2xl bg-gold/15 ring-1 ring-gold/30 px-4 py-3.5 mb-6" @click="emit('close')">
                    <span class="w-9 h-9 rounded-full bg-noir-900 text-gold-light flex items-center justify-center"><Icon name="lucide:sparkles" class="w-4 h-4" /></span>
                    <span class="flex-1 font-semibold text-noir-800">New in: see what just landed</span>
                    <Icon name="lucide:chevron-right" class="w-5 h-5 text-noir-800" />
                  </NuxtLink>
                  <ul class="divide-y divide-line">
                    <li v-for="(it, i) in dropdowns" :key="i">
                      <button v-if="it.columns?.length" class="w-full flex items-center justify-between py-4 font-display text-xl text-noir-800" @click="level = it">{{ it.label }} <Icon name="lucide:chevron-right" class="w-5 h-5 text-ink-faint" /></button>
                      <NuxtLink v-else :to="it.link.href" class="flex items-center justify-between py-4 font-display text-xl text-noir-800" @click="emit('close')">{{ it.label }}</NuxtLink>
                    </li>
                  </ul>
                  <template v-if="menu.discover?.length">
                    <p class="text-[0.68rem] tracking-[0.22em] uppercase text-ink-faint mt-8 mb-3">Discover</p>
                    <ul class="space-y-3.5">
                      <li v-for="(l, i) in menu.discover" :key="i"><NuxtLink :to="l.href" class="text-ink-soft hover:text-noir-800" @click="emit('close')">{{ l.display_label }}</NuxtLink></li>
                    </ul>
                  </template>
                  <div class="mt-8 pt-6 border-t border-line space-y-3 text-sm">
                    <NuxtLink to="/wishlist" class="flex items-center gap-2" @click="emit('close')"><Icon name="lucide:heart" class="w-4 h-4" /> Wishlist</NuxtLink>
                    <NuxtLink to="/stores" class="flex items-center gap-2" @click="emit('close')"><Icon name="lucide:map-pin" class="w-4 h-4" /> Our stores</NuxtLink>
                    <NuxtLink to="/account" class="s-btn-dark w-full mt-4" @click="emit('close')"><ClientOnly fallback="Sign in">{{ auth.signedIn.value ? 'My account' : 'Sign in' }}</ClientOnly></NuxtLink>
                  </div>
                </div>

                <!-- a dropdown -->
                <div v-else :key="level.label" class="p-5">
                  <p class="font-display text-3xl text-noir-800 mb-6">{{ level.label }}</p>
                  <section v-for="(c, ci) in level.columns" :key="ci" class="mb-8">
                    <p v-if="c.title" class="text-[0.68rem] tracking-[0.22em] uppercase text-ink-faint mb-3">{{ c.title }}</p>
                    <div v-if="c.kind === 'chips'" class="flex flex-wrap gap-2">
                      <NuxtLink v-for="(l, i) in c.links" :key="i" :to="l.href" class="rounded-full border border-line-strong px-3.5 py-1.5 text-sm" @click="emit('close')">{{ l.display_label }}</NuxtLink>
                    </div>
                    <div v-else-if="c.kind === 'cards'" class="grid grid-cols-2 gap-3">
                      <NuxtLink v-for="(l, i) in c.links" :key="i" :to="l.href" class="relative block aspect-[4/3] rounded-xl overflow-hidden bg-noir-800 text-cream" @click="emit('close')">
                        <img v-if="l.display_image" :src="l.display_image" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy">
                        <span class="absolute inset-0 bg-gradient-to-t from-noir-950/80 to-transparent" />
                        <span class="absolute left-3 bottom-2.5 font-display text-lg">{{ l.display_label }}</span>
                      </NuxtLink>
                    </div>
                    <ul v-else class="divide-y divide-line">
                      <li v-for="(l, i) in c.links" :key="i">
                        <NuxtLink :to="l.href" class="flex items-center justify-between py-3" :class="l.kind === 'brands' ? 'font-semibold text-noir-800' : 'text-ink'" @click="emit('close')">{{ l.display_label }} <Icon name="lucide:chevron-right" class="w-4 h-4 text-ink-faint" /></NuxtLink>
                      </li>
                    </ul>
                  </section>
                </div>
              </Transition>
            </div>
          </nav>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
