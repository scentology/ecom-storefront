<script setup>
// Signed out: email code sign-in. Signed in: a sidebar (who, sections, sign out) beside the open section — orders,
// profile or rewards (?tab=). A name is asked once, right after the first sign-in, while the account has none.
useSeoMeta({ title: 'My account', robots: 'noindex' })
const auth = useAuth()
const route = useRoute()
const router = useRouter()

const orders = ref([])
const wallet = ref(null)
const loading = ref(false)
const error = ref('')
const profile = reactive({ name: '' })
const saving = ref(false)
const savedMsg = ref('')
const localPhone = (p) => (p && p.startsWith('880') ? `0${p.slice(3)}` : p || '')

const me = computed(() => auth.user.value || {})
const initials = computed(() => {
  const n = (me.value.name || me.value.email || '?').trim()
  const parts = n.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (me.value.name ? parts[1]?.[0] || '' : '')).toUpperCase() || '?'
})
const needsName = computed(() => auth.signedIn.value && !me.value.name)

const tabs = computed(() => [
  { key: 'orders', label: 'Orders', icon: 'lucide:package' },
  { key: 'wishlist', label: 'Wishlist', icon: 'lucide:heart', to: '/wishlist' },
  { key: 'profile', label: 'Profile', icon: 'lucide:user-round' },
  ...(wallet.value ? [{ key: 'rewards', label: 'Rewards', icon: 'lucide:gem' }] : []),
])
const tab = computed(() => (['orders', 'profile', 'rewards'].includes(String(route.query.tab)) ? String(route.query.tab) : 'orders'))
const go = (t) => (t.to ? navigateTo(t.to) : router.replace({ query: { ...route.query, tab: t.key === 'orders' ? undefined : t.key } }))

const load = async () => {
  if (!auth.signedIn.value) return
  loading.value = true; error.value = ''
  try {
    const u = await auth.refreshMe()
    profile.name = u?.name || ''
    const [o, w] = await Promise.allSettled([auth.request('/orders', { query: { limit: 20 } }), auth.request('/wallet/me')])
    orders.value = o.status === 'fulfilled' ? o.value.data || [] : []
    wallet.value = w.status === 'fulfilled' ? w.value.data : null
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
// the session lives in shared state: load whenever it appears (first visit, or right after signing in)
watch(() => auth.signedIn.value, (v) => { if (v) load() }, { immediate: true })

const signedIn = () => {
  const next = String(route.query.next || '')
  if (next.startsWith('/') && !next.startsWith('//') && auth.user.value?.name) return navigateTo(next)
}

const saveName = async () => {
  if (!profile.name.trim()) return
  saving.value = true; error.value = ''; savedMsg.value = ''
  try {
    auth.user.value = (await auth.request('/auth/me', { method: 'PUT', body: { name: profile.name.trim(), email: me.value.email || '' } })).data
    savedMsg.value = 'Saved.'
    const next = String(route.query.next || '')
    if (next.startsWith('/') && !next.startsWith('//')) return navigateTo(next)
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

const converting = ref(false)
const convertMsg = ref('')
const convert = async () => {
  converting.value = true; convertMsg.value = ''
  try {
    wallet.value = (await auth.request('/wallet/me/convert', { method: 'POST', body: { points: wallet.value.points } })).data
    convertMsg.value = 'Added to your store credit.'
  } catch (e) { convertMsg.value = e.message } finally { converting.value = false }
}
const date = (v) => (v ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(String(v).replace(' ', 'T') + '+06:00')) : '')
</script>

<template>
  <section class="s-container py-12 sm:py-16">
    <ClientOnly>
      <!-- signed out -->
      <div v-if="!auth.signedIn.value" class="max-w-md mx-auto">
        <div class="text-center mb-8">
          <LayoutLogo stacked class="mx-auto" />
          <h1 class="s-title text-4xl text-noir-900 mt-8">Sign in</h1>
          <p class="text-ink-soft mt-2">Track orders, save addresses and check out faster.</p>
        </div>
        <div class="rounded-3xl bg-white ring-1 ring-line p-8 shadow-card"><AuthEmailSignIn @done="signedIn" /></div>
      </div>

      <!-- first sign-in: ask for a name once -->
      <div v-else-if="needsName" class="max-w-md mx-auto">
        <div class="rounded-3xl bg-noir-900 text-cream p-8 sm:p-10 shadow-lift relative overflow-hidden">
          <span class="absolute -right-16 -top-16 w-48 h-48 rounded-full border border-gold/20" />
          <p class="s-eyebrow text-gold">Welcome to Scentology</p>
          <h1 class="font-display text-4xl mt-3">What should we <span class="s-gold-text italic">call you?</span></h1>
          <p class="text-cream/70 text-sm mt-2">So your orders and notes are addressed to you. You can change it any time.</p>
          <form class="mt-7 space-y-3" @submit.prevent="saveName">
            <label for="n-name" class="sr-only">Your name</label>
            <input id="n-name" v-model="profile.name" required autocomplete="name" class="s-input !bg-white/5 !border-white/20 !text-cream placeholder:text-cream/40" placeholder="Your name">
            <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
            <button class="s-btn-gold w-full" :disabled="saving || !profile.name.trim()">{{ saving ? 'Saving…' : 'Continue' }}</button>
          </form>
          <p class="text-xs text-cream/50 mt-4 break-all">Signed in as {{ me.email }}</p>
        </div>
      </div>

      <!-- signed in -->
      <div v-else class="grid lg:grid-cols-[18.5rem_1fr] gap-8 lg:gap-12 items-start">
        <aside class="lg:sticky lg:top-28 rounded-3xl bg-white ring-1 ring-line shadow-card overflow-hidden">
          <div class="bg-noir-900 text-cream px-6 pt-7 pb-6 relative overflow-hidden">
            <span class="absolute -right-10 -top-10 w-32 h-32 rounded-full border border-gold/20" />
            <div class="flex items-center gap-4 relative">
              <span class="w-14 h-14 rounded-full bg-gradient-to-br from-gold-light to-gold-dark text-noir-900 flex items-center justify-center font-display text-2xl font-semibold shrink-0">{{ initials }}</span>
              <div class="min-w-0">
                <p class="text-[0.68rem] tracking-[0.22em] uppercase text-gold/90">My account</p>
                <h1 class="font-display text-2xl leading-tight truncate">{{ me.name }}</h1>
                <p class="text-xs text-cream/60 truncate">{{ me.email || localPhone(me.phone) }}</p>
              </div>
            </div>
          </div>
          <nav class="p-3" aria-label="Account">
            <button
              v-for="t in tabs" :key="t.key" type="button"
              class="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] transition"
              :class="tab === t.key ? 'bg-noir-900 text-cream' : 'text-ink hover:bg-cream'" @click="go(t)"
            >
              <Icon :name="t.icon" class="w-[1.15rem] h-[1.15rem]" :class="tab === t.key ? 'text-gold' : 'text-gold-dark'" />
              <span class="flex-1 text-left">{{ t.label }}</span>
              <span v-if="t.key === 'orders' && orders.length" class="text-xs tabular-nums rounded-full px-2 py-0.5" :class="tab === t.key ? 'bg-white/10' : 'bg-cream-deep'">{{ orders.length }}</span>
              <Icon v-else name="lucide:chevron-right" class="w-4 h-4 opacity-40" />
            </button>
            <div class="my-2 mx-4 border-t border-line" />
            <button type="button" class="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] text-ink-soft hover:bg-cream hover:text-sale transition" @click="auth.signOut()">
              <Icon name="lucide:log-out" class="w-[1.15rem] h-[1.15rem]" /> Sign out
            </button>
          </nav>
        </aside>

        <div class="min-w-0">
          <!-- orders -->
          <div v-if="tab === 'orders'">
            <h2 class="s-title text-3xl sm:text-4xl">Your <span class="s-gold-text italic">orders</span></h2>
            <p v-if="loading" class="text-ink-soft mt-8">Loading…</p>
            <div v-else-if="!orders.length" class="mt-8 rounded-3xl bg-white ring-1 ring-line p-10 text-center">
              <span class="mx-auto w-14 h-14 rounded-full bg-cream flex items-center justify-center"><Icon name="lucide:package-open" class="w-6 h-6 text-gold-dark" /></span>
              <p class="font-display text-2xl mt-4">No orders yet</p>
              <p class="text-ink-soft text-sm mt-1">Your orders will appear here once you place one.</p>
              <NuxtLink to="/products" class="s-btn-dark mt-6 inline-flex">Explore fragrances <Icon name="lucide:arrow-right" class="w-4 h-4" /></NuxtLink>
            </div>
            <ul v-else class="mt-8 space-y-3">
              <li v-for="o in orders" :key="o._id">
                <NuxtLink :to="`/account/orders/${o._id}`" class="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-5 hover:ring-noir-900 hover:shadow-card transition">
                  <div class="flex -space-x-3">
                    <img v-for="p in o.products.slice(0, 3)" :key="p.variant_id" :src="p.product_thumb" alt="" class="w-12 h-12 rounded-full object-contain bg-white ring-2 ring-white">
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold">Order {{ o.invoice_id }}</p>
                    <p class="text-sm text-ink-soft">{{ date(o.order_date) }} · {{ o.products.reduce((n, p) => n + p.quantity, 0) }} items</p>
                  </div>
                  <span class="rounded-full text-xs font-semibold px-3 py-1" :class="ORDER_STATUS[o.status]?.tone">{{ ORDER_STATUS[o.status]?.label || o.status }}</span>
                  <span class="font-semibold tabular-nums hidden sm:block">{{ money(o.grand_total) }}</span>
                  <Icon name="lucide:chevron-right" class="w-4 h-4 text-ink-faint" />
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- profile -->
          <div v-else-if="tab === 'profile'">
            <h2 class="s-title text-3xl sm:text-4xl">Your <span class="s-gold-text italic">profile</span></h2>
            <form class="mt-8 rounded-3xl bg-white ring-1 ring-line p-6 sm:p-8 max-w-xl space-y-5" @submit.prevent="saveName">
              <div>
                <label class="block text-sm font-medium mb-1.5" for="p-name">Name</label>
                <input id="p-name" v-model="profile.name" required autocomplete="name" class="s-input">
              </div>
              <div>
                <p class="block text-sm font-medium mb-1.5">Email</p>
                <p class="s-input !bg-cream/60 flex items-center gap-2 text-ink-soft"><Icon name="lucide:lock" class="w-4 h-4" />{{ me.email }}</p>
                <p class="text-xs text-ink-faint mt-1.5">You sign in with this email.</p>
              </div>
              <div v-if="me.phone">
                <p class="block text-sm font-medium mb-1.5">Phone</p>
                <p class="s-input !bg-cream/60 text-ink-soft">{{ localPhone(me.phone) }}</p>
              </div>
              <p v-if="error" class="text-sm text-sale">{{ error }}</p>
              <p v-if="savedMsg" class="text-sm text-green-700">{{ savedMsg }}</p>
              <button class="s-btn-dark" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
            </form>
          </div>

          <!-- rewards -->
          <div v-else-if="tab === 'rewards' && wallet">
            <h2 class="s-title text-3xl sm:text-4xl">Your <span class="s-gold-text italic">rewards</span></h2>
            <div class="mt-8 grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div class="rounded-3xl bg-noir-900 text-cream p-7">
                <p class="text-[0.7rem] tracking-[0.22em] uppercase text-gold">Store credit</p>
                <p class="font-display text-5xl mt-3 tabular-nums">{{ money(wallet.store_credit) }}</p>
                <p class="text-xs text-cream/60 mt-2">Use it at checkout or in our store.</p>
              </div>
              <div class="rounded-3xl bg-white ring-1 ring-line p-7">
                <p class="text-[0.7rem] tracking-[0.22em] uppercase text-ink-faint">Points</p>
                <p class="font-display text-5xl mt-3 tabular-nums">{{ wallet.points }}</p>
                <p v-if="wallet.loyalty_enabled" class="text-xs text-ink-faint mt-2">Earn {{ wallet.earn_per_100 }} point{{ wallet.earn_per_100 === 1 ? '' : 's' }} per ৳100 on delivered orders.</p>
              </div>
            </div>
            <p v-if="wallet.loyalty_enabled" class="text-sm text-ink-soft mt-5 max-w-2xl">{{ wallet.min_convert }} points or more turn into store credit (1 point = {{ money(wallet.point_value) }}).</p>
            <button v-if="wallet.loyalty_enabled && wallet.points >= wallet.min_convert" class="s-btn-line mt-4" :disabled="converting" @click="convert">Turn {{ wallet.points }} points into {{ money(wallet.points_worth) }}</button>
            <p v-if="convertMsg" class="text-sm mt-2">{{ convertMsg }}</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  </section>
</template>
