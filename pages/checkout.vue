<script setup>
// 1. sign in by email  2. delivery address  3. review (API cart prices it) and pay.
useSeoMeta({ title: 'Checkout', robots: 'noindex' })
const auth = useAuth()
const cart = useCart()
const router = useRouter()

const addresses = ref([])
const addressId = ref('')
const adding = ref(false)
const addr = reactive({ name: '', phone: '', address_line: '', city: 'Dhaka', zone: '', area: '', note: '' })
const addrError = ref('')
const addrFields = ref(null)

// delivery or click & collect
const fulfilment = ref('delivery')
const pickupStores = ref([])
const pickupId = ref('')
const loadStores = async () => {
  const ids = cart.lines.value.map((l) => l.variant_id)
  if (!ids.length) { pickupStores.value = []; return }
  try {
    const all = (await api('/stores', { query: { variant_id: ids } })).data || []
    pickupStores.value = all.filter((s) => s.pickup).map((s) => ({ ...s, hasAll: ids.every((id) => s.stock?.[id] && s.stock[id] !== 'out') }))
    if (pickupId.value && !pickupStores.value.some((s) => s._id === pickupId.value && s.hasAll)) pickupId.value = ''
  } catch { pickupStores.value = [] }
}
onMounted(loadStores)
watch(() => cart.lines.value.map((l) => l.variant_id).join(), loadStores)
const pickupStore = computed(() => pickupStores.value.find((s) => s._id === pickupId.value))

const gateways = ref([])
const gateway = ref('cod')
const priced = ref(null) // API cart with delivery fee and total
const pricing = ref(false)
const placing = ref(false)
const error = ref('')
const note = ref('')

const loadAddresses = async () => {
  const res = await auth.request('/addresses', { query: { limit: 20 } })
  addresses.value = res.data || []
  const def = addresses.value.find((a) => a.default) || addresses.value[0]
  addressId.value = def?._id || ''
  if (!pickupPhone.value) pickupPhone.value = def?.phone || localPhone(auth.user.value?.phone)
  adding.value = !addresses.value.length
  if (adding.value) Object.assign(addr, { name: auth.user.value?.name || '', phone: localPhone(auth.user.value?.phone) })
}
// store collection has no address, so it asks for the phone the store calls or texts
const pickupPhone = ref('')
const localPhone = (p) => (p && p.startsWith('880') ? `0${p.slice(3)}` : p || '')
// a new address starts from the account's name and phone
watch(() => auth.user.value, (u) => {
  if (!u) return
  if (!addr.name) addr.name = u.name || ''
  if (!addr.phone) addr.phone = localPhone(u.phone)
}, { immediate: true })

const init = async () => {
  if (!auth.signedIn.value) return
  try {
    await loadAddresses()
    gateways.value = (await api('/payments/gateways')).data?.gateways || ['cod']
    gateway.value = gateways.value.includes('cod') ? 'cod' : gateways.value[0]
  } catch (e) { error.value = e.message }
}
onMounted(init)
const onSignedIn = () => init()

const saveAddress = async () => {
  addrError.value = ''; addrFields.value = null
  try {
    const res = await auth.request('/addresses', { method: 'POST', body: { ...addr, call_name: addr.name, alternative_phone: '' } })
    addresses.value.unshift(res.data)
    addressId.value = res.data._id
    adding.value = false
  } catch (e) { addrError.value = e.message; addrFields.value = e.fields }
}

// price the bag for the chosen address with an API cart (delivery fee, total)
const price = async () => {
  const pickup = fulfilment.value === 'pickup'
  if ((pickup ? !pickupId.value : !addressId.value) || !cart.lines.value.length) { priced.value = null; return }
  pricing.value = true; error.value = ''
  try {
    const body = { ...(pickup ? {} : { address_id: addressId.value }), items: cart.lines.value.map((l) => ({ product_id: l.product_id, variant_id: l.variant_id, quantity: l.qty })) }
    // reuse the cart once made, so re-pricing doesn't leave a trail of carts behind
    const res = priced.value?.cart_id
      ? await auth.request(`/carts/${priced.value.cart_id}`, { method: 'PUT', body })
      : await auth.request('/carts', { method: 'POST', body })
    priced.value = res.data
    if (pickup) priced.value = { ...res.data, delivery_fee: 0, total_price: res.data.sales_amount } // collected: no delivery
  } catch (e) { error.value = e.message; priced.value = null } finally { pricing.value = false }
}
watch([addressId, fulfilment, pickupId, () => JSON.stringify(cart.lines.value)], price)

// ---- coupon, gift card, store credit ----
const couponInput = ref('')
const coupon = ref(null) // quote: { code, discount, free_delivery, description }
const couponError = ref('')
const applyCoupon = async (code = couponInput.value.trim()) => {
  couponError.value = ''
  if (!code || !priced.value) return
  try {
    coupon.value = (await auth.request('/coupons/quote', { method: 'POST', body: { code, cart_id: priced.value.cart_id, delivery_fee: priced.value.delivery_fee } })).data
    couponInput.value = ''
  } catch (e) { couponError.value = e.fields?.coupon_code?.[0] || e.message; coupon.value = null }
}
watch(priced, (p, old) => { if (coupon.value && p && p !== old) applyCoupon(coupon.value.code) }) // the bag or address changed

const cardInput = ref('')
const card = ref(null) // { code, balance }
const cardError = ref('')
const checkCard = async () => {
  cardError.value = ''
  const code = cardInput.value.trim()
  if (!code) return
  try { card.value = (await auth.request('/wallet/gift_cards/check', { method: 'POST', body: { code } })).data; cardInput.value = '' } catch (e) { cardError.value = e.fields?.gift_card_code?.[0] || e.message; card.value = null }
}
const wallet = ref(null)
const useCredit = ref(false)
watch(() => auth.signedIn.value, async (v) => {
  wallet.value = null
  if (v) try { wallet.value = (await auth.request('/wallet/me')).data } catch { /* no wallet shown */ }
}, { immediate: true })

const r2 = (v) => Math.round(v * 100) / 100
const discount = computed(() => coupon.value?.discount || 0)
const deliveryFee = computed(() => (coupon.value?.free_delivery ? 0 : priced.value?.delivery_fee || 0))
const orderTotal = computed(() => (priced.value ? Math.max(0, r2((priced.value.sales_amount || 0) - discount.value + deliveryFee.value)) : cart.subtotal.value))
const fromCard = computed(() => (card.value ? Math.min(card.value.balance, orderTotal.value) : 0))
const fromCredit = computed(() => (useCredit.value && wallet.value ? Math.min(wallet.value.store_credit, orderTotal.value - fromCard.value) : 0))
const toPay = computed(() => Math.max(0, r2(orderTotal.value - fromCard.value - fromCredit.value)))

const selected = computed(() => addresses.value.find((a) => a._id === addressId.value))
const place = async () => {
  const pickup = fulfilment.value === 'pickup'
  if (!priced.value || (pickup ? !pickupStore.value : !selected.value)) return
  if (pickup && !pickupPhone.value.trim()) { error.value = 'Add a phone number so the store can reach you.'; return }
  placing.value = true; error.value = ''
  try {
    const order = (await auth.request('/orders', { method: 'POST', body: {
      cart_id: priced.value.cart_id, address_id: pickup ? '' : addressId.value,
      fulfilment: fulfilment.value, pickup_location_id: pickup ? pickupId.value : '',
      customer_name: (pickup ? auth.user.value?.name : selected.value.name) || auth.user.value?.name || 'Customer',
      customer_phone: (pickup ? pickupPhone.value.trim() : selected.value.phone) || localPhone(auth.user.value?.phone),
      customer_email: auth.user.value?.email || '',
      coupon_code: coupon.value?.code || '', gift_card_code: card.value?.code || '', use_store_credit: useCredit.value && fromCredit.value > 0,
      gift_message: cart.giftMessage.value || '',
    } })).data
    if (order.due_amount <= 0.005) { // paid in full from the gift card / store credit
      cart.clear()
      router.push(`/account/orders/${order._id}?placed=1`)
      return
    }
    const pay = (await auth.request(`/orders/${order._id}/payment`, { method: 'POST', body: { payment_gateway: gateway.value } })).data
    cart.clear()
    if (pay.payment_url) { window.location.href = pay.payment_url; return }
    router.push(`/account/orders/${order._id}?placed=1`)
  } catch (e) { error.value = e.fields ? Object.values(e.fields).flat().join(' ') : e.message } finally { placing.value = false }
}
</script>

<template>
  <section class="s-container py-12 sm:py-16">
    <h1 class="s-title text-4xl sm:text-5xl text-noir-900">Checkout</h1>

    <ClientOnly>
    <template #fallback><p class="py-20 text-center text-ink-soft">Loading your bag…</p></template>
    <div v-if="!cart.lines.value.length" class="py-20 text-center">
      <p class="font-display text-2xl">Your bag is empty</p>
      <NuxtLink to="/products" class="s-btn-dark mt-6">Start shopping</NuxtLink>
    </div>

    <div v-else class="mt-10 grid lg:grid-cols-[1fr_24rem] gap-10 items-start">
      <div class="space-y-6">
        <!-- 1. sign in -->
        <section class="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
          <h2 class="font-display text-2xl flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-noir-900 text-gold-light text-sm font-sans flex items-center justify-center">1</span> Your details</h2>
          <ClientOnly>
            <div v-if="auth.signedIn.value" class="mt-4 flex items-center justify-between text-sm">
              <p><span class="text-ink-soft">Signed in as</span> <strong>{{ auth.user.value?.name || auth.user.value?.email }}</strong> <span class="text-ink-faint break-all">{{ auth.user.value?.email || localPhone(auth.user.value?.phone) }}</span></p>
              <button class="text-ink-soft underline" @click="auth.signOut(); addresses = []">Not you?</button>
            </div>
            <div v-else class="mt-6 max-w-sm"><AuthEmailSignIn @done="onSignedIn" /></div>
          </ClientOnly>
        </section>

        <!-- 2. address -->
        <section class="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8" :class="{ 'opacity-50 pointer-events-none': !auth.signedIn.value }">
          <h2 class="font-display text-2xl flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-noir-900 text-gold-light text-sm font-sans flex items-center justify-center">2</span> {{ fulfilment === 'pickup' ? 'Collect from' : 'Delivery address' }}</h2>
          <div v-if="pickupStores.length" class="mt-5 grid grid-cols-2 gap-2 max-w-md" role="radiogroup" aria-label="How you get it">
            <button type="button" role="radio" :aria-checked="fulfilment === 'delivery'" class="rounded-xl ring-1 p-3 text-sm text-left" :class="fulfilment === 'delivery' ? 'ring-noir-900 bg-cream' : 'ring-line'" @click="fulfilment = 'delivery'">
              <Icon name="lucide:truck" class="w-4 h-4" /> <strong>Delivery</strong><span class="block text-ink-soft text-xs">1–4 days</span>
            </button>
            <button type="button" role="radio" :aria-checked="fulfilment === 'pickup'" class="rounded-xl ring-1 p-3 text-sm text-left" :class="fulfilment === 'pickup' ? 'ring-noir-900 bg-cream' : 'ring-line'" @click="fulfilment = 'pickup'">
              <Icon name="lucide:store" class="w-4 h-4" /> <strong>Collect from a store</strong><span class="block text-ink-soft text-xs">Free · we'll tell you when it's ready</span>
            </button>
          </div>
          <div v-if="fulfilment === 'pickup'" class="mt-5 space-y-3">
            <label v-for="st in pickupStores" :key="st._id" class="flex gap-3 rounded-xl ring-1 p-4" :class="[pickupId === st._id ? 'ring-noir-900 bg-cream' : 'ring-line', st.hasAll ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed']">
              <input v-model="pickupId" type="radio" :value="st._id" :disabled="!st.hasAll" class="mt-1 accent-noir-900">
              <span class="text-sm flex-1">
                <strong>{{ st.name }}</strong><span v-if="!st.hasAll" class="text-sale"> · not everything in your bag is here</span><br>
                <span class="text-ink-soft">{{ st.address }}</span>
                <span v-if="st.hours" class="block text-ink-faint text-xs mt-0.5">{{ st.hours }}</span>
              </span>
            </label>
            <div class="max-w-xs pt-1"><label class="block text-sm font-medium mb-1.5" for="p-phone">Your phone</label><input id="p-phone" v-model="pickupPhone" required type="tel" inputmode="tel" class="s-input" autocomplete="tel" placeholder="01XXXXXXXXX"></div>
          </div>
          <ClientOnly v-else>
            <div v-if="addresses.length && !adding" class="mt-6 space-y-3">
              <label v-for="a in addresses" :key="a._id" class="flex gap-3 rounded-xl ring-1 p-4 cursor-pointer" :class="addressId === a._id ? 'ring-noir-900 bg-cream' : 'ring-line'">
                <input v-model="addressId" type="radio" :value="a._id" class="mt-1 accent-noir-900">
                <span class="text-sm">
                  <strong>{{ a.name || 'Address' }}</strong> · {{ a.phone }}<br>
                  <span class="text-ink-soft">{{ [a.address_line, a.area, a.zone, a.city].filter(Boolean).join(', ') }}</span>
                </span>
              </label>
              <button class="text-sm font-semibold underline" @click="adding = true; Object.assign(addr, { name: auth.user.value?.name || '', phone: localPhone(auth.user.value?.phone) })">+ Add a new address</button>
            </div>
            <form v-else-if="auth.signedIn.value" class="mt-6 grid sm:grid-cols-2 gap-4" @submit.prevent="saveAddress">
              <div><label class="block text-sm font-medium mb-1.5" for="a-name">Receiver's name</label><input id="a-name" v-model="addr.name" required class="s-input" autocomplete="name"></div>
              <div><label class="block text-sm font-medium mb-1.5" for="a-phone">Receiver's phone</label><input id="a-phone" v-model="addr.phone" required type="tel" class="s-input" autocomplete="tel"></div>
              <div class="sm:col-span-2"><label class="block text-sm font-medium mb-1.5" for="a-line">House, road, area</label><input id="a-line" v-model="addr.address_line" required class="s-input" autocomplete="street-address" placeholder="House 12, Road 5, Block C"></div>
              <div>
                <label class="block text-sm font-medium mb-1.5" for="a-city">District</label>
                <select id="a-city" v-model="addr.city" class="s-input"><option v-for="d in DISTRICTS" :key="d">{{ d }}</option></select>
              </div>
              <div><label class="block text-sm font-medium mb-1.5" for="a-zone">Thana / area</label><input id="a-zone" v-model="addr.zone" required class="s-input" placeholder="e.g. Dhanmondi"></div>
              <div class="sm:col-span-2"><label class="block text-sm font-medium mb-1.5" for="a-note">Note for the courier <span class="text-ink-faint font-normal">(optional)</span></label><input id="a-note" v-model="addr.note" class="s-input" placeholder="Landmark, best time to call…"></div>
              <p v-if="addrError" class="sm:col-span-2 text-sm text-sale">{{ addrError }}</p>
              <div class="sm:col-span-2 flex gap-3">
                <button class="s-btn-dark">Save address</button>
                <button v-if="addresses.length" type="button" class="s-btn-line" @click="adding = false">Cancel</button>
              </div>
            </form>
          </ClientOnly>
        </section>

        <!-- 3. payment -->
        <section class="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8" :class="{ 'opacity-50 pointer-events-none': !priced }">
          <h2 class="font-display text-2xl flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-noir-900 text-gold-light text-sm font-sans flex items-center justify-center">3</span> Payment</h2>
          <div class="mt-6 grid sm:grid-cols-2 gap-3">
            <label v-for="g in gateways" :key="g" class="flex gap-3 rounded-xl ring-1 p-4 cursor-pointer" :class="gateway === g ? 'ring-noir-900 bg-cream' : 'ring-line'">
              <input v-model="gateway" type="radio" :value="g" class="mt-1 accent-noir-900">
              <span class="text-sm"><strong class="flex items-center gap-2"><Icon :name="GATEWAYS[g]?.icon || 'lucide:wallet'" class="w-4 h-4" />{{ fulfilment === 'pickup' && g === 'cod' ? 'Pay when you collect' : GATEWAYS[g]?.label || g }}</strong><span class="text-ink-soft">{{ fulfilment === 'pickup' && g === 'cod' ? 'Cash, card or bKash at the store.' : GATEWAYS[g]?.hint }}</span></span>
            </label>
          </div>
        </section>
      </div>

      <!-- summary -->
      <aside class="rounded-2xl bg-white ring-1 ring-line p-6 lg:sticky lg:top-28">
        <h2 class="font-display text-2xl">Order summary</h2>
        <ul class="mt-5 divide-y divide-line">
          <li v-for="l in cart.lines.value" :key="l.variant_id" class="py-3 flex gap-3 text-sm">
            <img v-if="l.thumb" :src="l.thumb" alt="" class="w-14 h-16 rounded-lg object-contain p-1 bg-white ring-1 ring-line">
            <span class="flex-1 min-w-0"><span class="block font-medium truncate">{{ l.title }}</span><span class="text-ink-faint text-xs">{{ Object.values(l.attrs || {}).join(' · ') }} · × {{ l.qty }}</span></span>
            <span class="tabular-nums">{{ money(l.price * l.qty) }}</span>
          </li>
        </ul>
        <dl class="mt-4 pt-4 border-t border-line space-y-2 text-sm tabular-nums">
          <div class="flex justify-between"><dt class="text-ink-soft">Subtotal</dt><dd>{{ money(priced?.sales_amount ?? cart.subtotal.value) }}</dd></div>
          <div v-if="discount" class="flex justify-between text-gold-deep"><dt>{{ coupon.code }}</dt><dd>−{{ money(discount) }}</dd></div>
          <div class="flex justify-between"><dt class="text-ink-soft">Delivery</dt><dd>{{ fulfilment === 'pickup' ? 'Free, collect' : pricing ? '…' : priced ? (coupon?.free_delivery ? 'Free' : money(priced.delivery_fee)) : 'Add an address' }}</dd></div>
          <div class="flex justify-between text-base font-semibold pt-2 border-t border-line"><dt>Total</dt><dd>{{ money(orderTotal) }}</dd></div>
          <div v-if="fromCard" class="flex justify-between"><dt class="text-ink-soft">Gift card</dt><dd>−{{ money(fromCard) }}</dd></div>
          <div v-if="fromCredit" class="flex justify-between"><dt class="text-ink-soft">Store credit</dt><dd>−{{ money(fromCredit) }}</dd></div>
          <div v-if="fromCard || fromCredit" class="flex justify-between font-semibold"><dt>To pay</dt><dd>{{ money(toPay) }}</dd></div>
          <p class="text-xs text-ink-faint">Prices include VAT.</p>
        </dl>
        <div class="mt-5 pt-4 border-t border-line space-y-3 text-sm" :class="{ 'opacity-50 pointer-events-none': !priced }">
          <div v-if="coupon" class="flex items-center justify-between rounded-lg bg-gold/10 px-3 py-2">
            <span><strong>{{ coupon.code }}</strong> applied<template v-if="coupon.description"> · {{ coupon.description }}</template></span>
            <button class="underline text-ink-soft" @click="coupon = null">Remove</button>
          </div>
          <form v-else class="flex gap-2" @submit.prevent="applyCoupon()">
            <input v-model="couponInput" class="s-input !py-2 uppercase" placeholder="Coupon code" aria-label="Coupon code">
            <button class="s-btn-line !px-4 !py-2" :disabled="!couponInput.trim()">Apply</button>
          </form>
          <p v-if="couponError" class="text-sale -mt-1">{{ couponError }}</p>
          <div v-if="card" class="flex items-center justify-between rounded-lg bg-cream px-3 py-2">
            <span>Gift card <span class="tabular-nums">{{ card.code.slice(-4) }}</span> · {{ money(card.balance) }}</span>
            <button class="underline text-ink-soft" @click="card = null">Remove</button>
          </div>
          <form v-else class="flex gap-2" @submit.prevent="checkCard">
            <input v-model="cardInput" class="s-input !py-2 uppercase" placeholder="Gift card code" aria-label="Gift card code">
            <button class="s-btn-line !px-4 !py-2" :disabled="!cardInput.trim()">Use</button>
          </form>
          <p v-if="cardError" class="text-sale -mt-1">{{ cardError }}</p>
          <label v-if="wallet?.store_credit > 0" class="flex items-center gap-2">
            <input v-model="useCredit" type="checkbox" class="accent-noir-900"> Use my store credit ({{ money(wallet.store_credit) }})
          </label>
        </div>
        <ClientOnly>
          <details class="mt-5 text-sm group" :open="!!cart.giftMessage.value">
            <summary class="cursor-pointer list-none flex items-center gap-2 text-noir-800 font-semibold"><Icon name="lucide:gift" class="w-4 h-4 text-gold-dark" /> {{ cart.giftMessage.value ? 'Gift message' : 'Add a gift message' }} <Icon name="lucide:chevron-down" class="w-4 h-4 ml-auto transition group-open:rotate-180" /></summary>
            <textarea v-model="cart.giftMessage.value" rows="3" maxlength="300" class="s-input mt-3 !text-sm" placeholder="Printed on the card in the box" aria-label="Gift message" />
            <p class="text-xs text-ink-faint text-right mt-1 tabular-nums">{{ cart.giftMessage.value.length }}/300</p>
          </details>
        </ClientOnly>
        <p v-if="error" class="mt-4 text-sm text-sale" role="alert">{{ error }}</p>
        <button class="s-btn-gold w-full mt-6" :disabled="!priced || placing || pricing" @click="place">
          {{ placing ? 'Placing your order…' : toPay <= 0 || gateway === 'cod' ? 'Place order' : 'Pay and place order' }}
        </button>
        <p class="text-xs text-ink-faint text-center mt-3 flex items-center justify-center gap-1.5"><Icon name="lucide:lock" class="w-3.5 h-3.5" /> Secure checkout</p>
      </aside>
    </div>
    </ClientOnly>
  </section>
</template>
