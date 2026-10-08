<script setup>
useSeoMeta({ title: 'Your order', robots: 'noindex' })
const route = useRoute()
const auth = useAuth()
const order = ref(null)
const error = ref('')
const placed = computed(() => route.query.placed === '1')
onMounted(async () => {
  if (!auth.signedIn.value) { error.value = 'Sign in to see this order.'; return }
  try { order.value = (await auth.request(`/orders/${route.params.id}`)).data } catch (e) { error.value = e.status === 404 ? 'We couldn’t find that order.' : e.message }
})
// returns: a delivered order can be sent back within the return window
const returnable = ref(null)
const myReturns = ref([])
const loadReturns = async () => {
  if (order.value?.status !== 'DELIVERED') return
  try {
    const [r, list] = await Promise.all([auth.request('/returns/returnable', { query: { order_id: order.value._id } }), auth.request('/returns', { query: { order_id: order.value._id } })])
    returnable.value = r.data
    myReturns.value = list.data || []
  } catch { /* the section just stays hidden */ }
}
watch(order, loadReturns)
const canReturn = computed(() => returnable.value?.within_window && returnable.value.lines.some((l) => l.returnable > 0))
const REASONS = ['Wrong size or colour', "Doesn't fit", 'Arrived damaged', 'Not as described', 'Changed my mind', 'Wrong item sent']
const RETURN_STATUS = {
  requested: 'Waiting for approval', approved: 'Approved: send the item back', received: 'Received: refund on its way',
  completed: 'Refunded', rejected: 'Not accepted', cancelled: 'Cancelled',
}
const asking = ref(false)
const picks = ref({}) // variant_id → { qty, reason }
const startReturn = () => {
  picks.value = Object.fromEntries(returnable.value.lines.map((l) => [l.variant_id, { qty: 0, reason: '' }]))
  retError.value = ''; asking.value = true
}
const retBusy = ref(false)
const retError = ref('')
const refundPreview = computed(() => (returnable.value?.lines || []).reduce((n, l) => n + (picks.value[l.variant_id]?.qty || 0) * l.unit_refund, 0))
const sendReturn = async () => {
  const items = Object.entries(picks.value).filter(([, p]) => p.qty > 0).map(([variant_id, p]) => ({ variant_id, quantity: p.qty, reason: p.reason }))
  if (!items.length) { retError.value = 'Choose the item you are returning.'; return }
  if (items.some((i) => !i.reason)) { retError.value = 'Tell us why each item is coming back.'; return }
  retBusy.value = true; retError.value = ''
  try {
    await auth.request('/returns', { method: 'POST', body: { order_id: order.value._id, items } })
    asking.value = false
    await loadReturns()
  } catch (e) { retError.value = e.fields ? Object.values(e.fields).flat().join(' ') : e.message } finally { retBusy.value = false }
}
const cancelReturn = async (r) => {
  try { await auth.request(`/returns/${r._id}/cancel`, { method: 'POST', body: { note: '' } }); await loadReturns() } catch (e) { retError.value = e.message }
}
const dateOf = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }) : '')

const pickup = computed(() => order.value?.fulfilment === 'pickup')
const steps = computed(() => (pickup.value ? ['PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED'] : ['PROCESSING', 'ON_SHIPPING', 'DELIVERED']))
const stepIndex = computed(() => steps.value.indexOf(order.value?.status))
const store = ref(null)
watch(order, async (o) => {
  if (!o || o.fulfilment !== 'pickup' || !o.location_id) return
  try { store.value = ((await api('/stores')).data || []).find((s) => s._id === o.location_id) || null } catch { /* just the label */ }
})
</script>

<template>
  <section class="s-container py-14 max-w-4xl">
    <ClientOnly>
      <p v-if="error" class="text-center py-20 text-ink-soft">{{ error }} <NuxtLink to="/account" class="underline">My account</NuxtLink></p>
      <div v-else-if="order">
        <div v-if="placed" class="s-band rounded-2xl p-8 sm:p-10 text-center mb-10">
          <Icon name="lucide:circle-check" class="w-12 h-12 mx-auto text-gold" />
          <h1 class="s-title text-4xl mt-4">Thank you, <em class="s-gold-text">order placed</em></h1>
          <p class="text-cream/70 mt-3">Order {{ order.invoice_id }}. We'll let you know when it ships.</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <NuxtLink to="/account" class="text-sm text-ink-soft inline-flex items-center gap-1"><Icon name="lucide:arrow-left" class="w-4 h-4" /> My orders</NuxtLink>
            <h2 class="font-display text-3xl mt-2">Order {{ order.invoice_id }}</h2>
          </div>
          <span class="rounded-full text-sm font-semibold px-4 py-1.5" :class="ORDER_STATUS[order.status]?.tone">{{ ORDER_STATUS[order.status]?.label || order.status }}</span>
        </div>

        <ol v-if="stepIndex >= 0" class="mt-8 grid grid-cols-3 gap-2">
          <li v-for="(s, i) in steps" :key="s" class="text-center">
            <span class="block h-1.5 rounded-full" :class="i <= stepIndex ? 'bg-gold' : 'bg-line'" />
            <span class="block text-xs mt-2" :class="i <= stepIndex ? 'text-ink font-semibold' : 'text-ink-faint'">{{ pickup && s === 'DELIVERED' ? 'Collected' : ORDER_STATUS[s].label }}</span>
          </li>
        </ol>
        <p v-if="order.delivery_tracking_link" class="mt-4 text-sm"><a :href="order.delivery_tracking_link" target="_blank" rel="noopener" class="underline">Track your parcel</a></p>

        <div class="mt-8 grid md:grid-cols-[1fr_18rem] gap-6">
          <ul class="rounded-2xl bg-white ring-1 ring-line divide-y divide-line">
            <li v-for="p in order.products" :key="p.variant_id" class="p-4 flex gap-4">
              <img :src="p.product_thumb" alt="" class="w-16 h-20 rounded-lg object-contain p-1 bg-white ring-1 ring-line">
              <div class="flex-1 min-w-0"><p class="font-medium">{{ p.product_title }}</p><p class="text-xs text-ink-faint">{{ Object.values(p.variant_attributes || {}).join(' · ') }} · × {{ p.quantity }}</p></div>
              <p class="tabular-nums">{{ money(p.total_amount) }}</p>
            </li>
          </ul>
          <aside class="space-y-4">
            <dl class="rounded-2xl bg-white ring-1 ring-line p-5 text-sm space-y-2 tabular-nums">
              <div class="flex justify-between"><dt class="text-ink-soft">Subtotal</dt><dd>{{ money(order.sales_amount) }}</dd></div>
              <div class="flex justify-between"><dt class="text-ink-soft">Delivery</dt><dd>{{ money(order.delivery_fee) }}</dd></div>
              <div class="flex justify-between font-semibold pt-2 border-t border-line"><dt>Total</dt><dd>{{ money(order.grand_total) }}</dd></div>
              <div v-if="order.due_amount > 0 && order.status !== 'DELIVERED'" class="flex justify-between"><dt class="text-ink-soft">{{ pickup ? 'To pay when you collect' : 'To pay on delivery' }}</dt><dd>{{ money(order.due_amount) }}</dd></div>
            </dl>
            <div v-if="pickup" class="rounded-2xl bg-white ring-1 ring-line p-5 text-sm">
              <p class="font-semibold">Collect from</p>
              <p class="text-ink-soft mt-1">{{ store?.name || 'Our store' }}<br>{{ store?.address }}<br><span v-if="store?.hours" class="text-ink-faint">{{ store.hours }}</span></p>
              <p class="mt-2">{{ order.status === 'READY_FOR_PICKUP' ? 'It’s ready: bring your order number.' : 'We’ll let you know when it’s ready.' }}</p>
              <a v-if="store" :href="mapsLink(store)" target="_blank" rel="noopener" class="underline text-ink-soft mt-2 inline-block">Directions</a>
            </div>
            <div v-else class="rounded-2xl bg-white ring-1 ring-line p-5 text-sm">
              <p class="font-semibold">Delivering to</p>
              <p class="text-ink-soft mt-1">{{ order.delivery_address?.name }} · {{ order.delivery_address?.phone }}<br>{{ [order.delivery_address?.address_line, order.delivery_address?.zone, order.delivery_address?.city].filter(Boolean).join(', ') }}</p>
            </div>
          </aside>
        </div>

        <!-- returns -->
        <section v-if="returnable && (myReturns.length || canReturn)" class="mt-10 rounded-2xl bg-white ring-1 ring-line p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="font-display text-2xl">Returns</h3>
              <p v-if="canReturn && returnable.window_ends" class="text-sm text-ink-soft mt-1">You can return items until {{ dateOf(returnable.window_ends) }}.</p>
            </div>
            <button v-if="canReturn && !asking" class="s-btn-line" @click="startReturn">Return an item</button>
          </div>

          <ul v-if="myReturns.length" class="mt-5 divide-y divide-line">
            <li v-for="r in myReturns" :key="r._id" class="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p class="font-semibold">{{ r.number }} · {{ r.items.map((i) => `${i.title} × ${i.quantity}`).join(', ') }}</p>
                <p class="text-ink-soft">{{ RETURN_STATUS[r.status] || r.status }}<template v-if="r.status === 'rejected' && r.events.at(-1)?.note">: {{ r.events.at(-1).note }}</template></p>
              </div>
              <div class="flex items-center gap-3">
                <span class="tabular-nums">{{ money(r.refunded || r.refund_total) }}</span>
                <button v-if="r.status === 'requested'" class="text-sm underline text-ink-soft" @click="cancelReturn(r)">Cancel request</button>
              </div>
            </li>
          </ul>

          <form v-if="asking" class="mt-5 space-y-4" @submit.prevent="sendReturn">
            <div v-for="l in returnable.lines.filter((x) => x.returnable > 0)" :key="l.variant_id" class="grid sm:grid-cols-[1fr_6rem_14rem] gap-3 items-center">
              <div class="flex items-center gap-3 min-w-0">
                <img v-if="l.thumb" :src="l.thumb" alt="" class="w-12 h-14 rounded-lg object-contain p-1 bg-white ring-1 ring-line">
                <div class="min-w-0"><p class="font-medium truncate">{{ l.title }}</p><p class="text-xs text-ink-faint">{{ Object.values(l.variant_attributes || {}).join(' · ') }} · {{ money(l.unit_refund) }} each</p></div>
              </div>
              <select v-model.number="picks[l.variant_id].qty" class="s-input !py-2" :aria-label="`How many ${l.title}`">
                <option v-for="n in l.returnable + 1" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
              <select v-model="picks[l.variant_id].reason" class="s-input !py-2" :disabled="!picks[l.variant_id].qty" :aria-label="`Why is ${l.title} coming back`">
                <option value="">Why?</option>
                <option v-for="r in REASONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <p v-if="retError" class="text-sm text-red-700">{{ retError }}</p>
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button class="s-btn-dark" :disabled="retBusy">{{ retBusy ? 'Sending…' : 'Request return' }}</button>
              <button type="button" class="text-sm underline text-ink-soft" @click="asking = false">Cancel</button>
              <span v-if="refundPreview" class="ml-auto text-sm">Refund <strong class="tabular-nums">{{ money(refundPreview) }}</strong> once we receive it</span>
            </div>
            <p class="text-xs text-ink-faint">We'll review your request and tell you where to send the item. Delivery charges aren't refunded.</p>
          </form>
        </section>
      </div>
      <p v-else class="text-center py-20 text-ink-soft">Loading…</p>
    </ClientOnly>
  </section>
</template>
