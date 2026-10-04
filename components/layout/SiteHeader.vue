<script setup>
// Centred logo; the main menu (from the admin's menu builder) on the left with mega dropdowns; search, wishlist,
// bag and account on the right. Phones get a drill-down menu.
const { data: menu } = await useMenu()
const cart = useCart()
const auth = useAuth()
const saved = useWishlist()
const route = useRoute()

const menuOpen = ref(false) // phone menu
const searchOpen = ref(false)
const openAt = ref(-1) // the open dropdown
watch(() => route.fullPath, () => { menuOpen.value = false; searchOpen.value = false; openAt.value = -1 })

// open on hover with a short grace period, so moving the mouse down into the panel doesn't close it
let closeTimer
const hoverOpen = (i) => { clearTimeout(closeTimer); openAt.value = i }
const hoverClose = () => { clearTimeout(closeTimer); closeTimer = setTimeout(() => { openAt.value = -1 }, 140) }
const toggle = (i) => { openAt.value = openAt.value === i ? -1 : i }
const items = computed(() => menu.value?.items || [])
const open = computed(() => items.value[openAt.value])

// the entry the page belongs to (underlined)
const current = computed(() => {
  const here = route.fullPath
  return items.value.findIndex((it) => (it.link && here.startsWith(it.link.href))
    || (it.columns || []).some((c) => c.links.some((l) => l.href === here)))
})

const onKey = (e) => {
  if (e.key === 'Escape') { openAt.value = -1; searchOpen.value = false }
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))) { e.preventDefault(); searchOpen.value = true }
}
const scrolled = ref(false)
onMounted(() => {
  const onScroll = () => { scrolled.value = window.scrollY > 24 }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey) })
})
// many top-level entries (one per category) need the wider screens before they sit beside the logo
const compact = computed(() => (items.value?.length || 0) > 5)
</script>

<template>
  <header class="sticky top-0 z-40 bg-noir-900/95 backdrop-blur text-cream border-b border-white/10 transition-shadow" :class="{ 'shadow-lift': scrolled }" @mouseleave="hoverClose">
    <div class="s-container h-16 sm:h-[4.5rem] grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
      <!-- left: the menu -->
      <nav class="flex items-center gap-1 min-w-0" aria-label="Main">
        <button class="-ml-2 p-2" :class="compact ? 'xl:hidden' : 'lg:hidden'" aria-label="Open menu" @click="menuOpen = true"><Icon name="lucide:menu" class="w-6 h-6" /></button>
        <ul class="hidden items-center gap-5 xl:gap-7 text-[0.9rem] whitespace-nowrap" :class="compact ? 'xl:flex' : 'lg:flex'">
          <li v-for="(it, i) in items" :key="i" @mouseenter="it.columns?.length ? hoverOpen(i) : hoverClose()">
            <button
              v-if="it.columns?.length" class="relative inline-flex items-center gap-1 py-6 transition-colors hover:text-gold" :class="{ 'text-gold': openAt === i }"
              :aria-expanded="openAt === i" aria-haspopup="true" @click="toggle(i)"
            >
              {{ it.label }} <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': openAt === i }" />
              <span class="absolute left-0 right-5 bottom-4 h-px bg-gold origin-left transition-transform duration-300" :class="openAt === i || current === i ? 'scale-x-100' : 'scale-x-0'" />
            </button>
            <NuxtLink v-else :to="it.link.href" class="relative inline-block py-6 transition-colors hover:text-gold">
              {{ it.label }}
              <span class="absolute inset-x-0 bottom-4 h-px bg-gold origin-left transition-transform duration-300" :class="current === i ? 'scale-x-100' : 'scale-x-0'" />
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <LayoutLogo light />

      <!-- right -->
      <div class="flex items-center justify-end gap-0.5 sm:gap-1.5">
        <button class="p-2.5 hover:text-gold transition-colors" aria-label="Search (press /)" @click="searchOpen = true"><Icon name="lucide:search" class="w-5 h-5" /></button>
        <NuxtLink to="/wishlist" class="relative p-2.5 hover:text-gold transition-colors hidden sm:inline-flex" aria-label="Wishlist">
          <Icon name="lucide:heart" class="w-5 h-5" />
          <ClientOnly><span v-if="saved.ids.value.length" class="absolute top-1 right-0.5 min-w-4 h-4 px-1 rounded-full bg-gold text-noir-900 text-[0.62rem] font-bold flex items-center justify-center">{{ saved.ids.value.length }}</span></ClientOnly>
        </NuxtLink>
        <button class="relative p-2.5 hover:text-gold transition-colors" aria-label="Open bag" @click="cart.open.value = true">
          <Icon name="lucide:shopping-bag" class="w-5 h-5" />
          <ClientOnly><span v-if="cart.count.value" class="absolute top-1 right-0.5 min-w-4 h-4 px-1 rounded-full bg-gold text-noir-900 text-[0.62rem] font-bold flex items-center justify-center">{{ cart.count.value }}</span></ClientOnly>
        </button>
        <NuxtLink to="/account" class="hidden md:inline-flex ml-2 s-btn border border-white/30 !px-5 !py-2 hover:border-gold hover:text-gold"><ClientOnly fallback="Sign in">{{ auth.signedIn.value ? (auth.user.value?.name?.split(" ")[0] || "Account") : "Sign in" }}</ClientOnly></NuxtLink>
      </div>
    </div>

    <!-- mega menu -->
    <Transition enter-from-class="opacity-0 -translate-y-2" enter-active-class="transition duration-200 ease-out" leave-to-class="opacity-0 -translate-y-1" leave-active-class="transition duration-150">
      <div v-if="open?.columns?.length" :key="openAt" class="hidden lg:block absolute inset-x-0 top-full bg-white text-ink border-b border-line shadow-lift" @mouseenter="hoverOpen(openAt)">
        <LayoutMegaMenu :item="open" />
      </div>
    </Transition>

    <LayoutSearchOverlay :open="searchOpen" @close="searchOpen = false" />
    <LayoutMobileMenu :open="menuOpen" :menu="menu" @close="menuOpen = false" />
  </header>
</template>
