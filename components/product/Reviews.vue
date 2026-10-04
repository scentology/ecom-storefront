<script setup>
// A product's approved reviews: the summary with a bar per star, the reviews (paged), and a form for customers
// who received it.
const props = defineProps({ productId: { type: String, required: true } })
const auth = useAuth()
const shop = useShop()
const { show } = useToast()
const PAGE = 5
const page = ref(1)
const { data, refresh } = await useAsyncData(`reviews-${props.productId}`, () => api(`/reviews/product/${props.productId}`, { query: { page: page.value, limit: PAGE } }), { watch: [page], default: () => null })
const reviews = computed(() => data.value?.data?.reviews || [])
const summary = computed(() => data.value?.data?.summary || { average: 0, count: 0, stars: [0, 0, 0, 0, 0, 0] })
const total = computed(() => data.value?.pagination?.total || 0)
const pages = computed(() => Math.max(1, Math.ceil(total.value / PAGE)))
const date = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(new Date(d))

// writing
const open = ref(false)
const eligibility = ref(null)
const form = reactive({ rating: 0, title: '', body: '' })
const hover = ref(0)
const busy = ref(false)
const error = ref('')
const start = async () => {
  if (!auth.signedIn.value) return navigateTo({ path: '/account', query: { next: useRoute().fullPath } })
  error.value = ''
  try {
    eligibility.value = (await auth.request(`/reviews/product/${props.productId}/mine`)).data
    const mine = eligibility.value.mine
    if (mine) Object.assign(form, { rating: mine.rating, title: mine.title, body: mine.body })
    open.value = true
  } catch (e) { error.value = e.message }
}
const submit = async () => {
  if (!form.rating) { error.value = 'Choose a star rating.'; return }
  busy.value = true; error.value = ''
  try {
    await auth.request('/reviews', { method: 'POST', body: { product_id: props.productId, ...form } })
    open.value = false
    show({ title: 'Thanks for your review', body: 'It shows once we’ve had a look.', icon: 'lucide:star' })
    refresh()
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <section id="reviews" class="s-container py-14 border-t border-line scroll-mt-28">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h2 class="s-title text-3xl text-noir-800">Customer reviews</h2>
      <button class="s-btn-line !py-2.5" @click="start"><Icon name="lucide:pen-line" class="w-4 h-4" /> Write a review</button>
    </div>

    <div class="grid lg:grid-cols-[18rem_1fr] gap-10 mt-8">
      <div v-reveal="'left'">
        <template v-if="summary.count">
          <p class="flex items-end gap-3"><span class="text-5xl font-semibold text-noir-800 tabular-nums">{{ summary.average.toFixed(1) }}</span><span class="pb-2 text-ink-soft text-sm">out of 5</span></p>
          <ProductStars :value="summary.average" size="w-5 h-5" class="mt-2" />
          <p class="text-sm text-ink-soft mt-1">{{ summary.count }} {{ summary.count === 1 ? 'review' : 'reviews' }}, all from verified buyers</p>
          <ul class="mt-5 space-y-1.5">
            <li v-for="s in [5, 4, 3, 2, 1]" :key="s" class="flex items-center gap-3 text-xs text-ink-soft">
              <span class="w-3 tabular-nums">{{ s }}</span><ProductStars :value="1" size="w-3 h-3" class="[&>span:not(:first-child)]:hidden" />
              <span class="flex-1 h-1.5 rounded-full bg-line overflow-hidden"><span class="block h-full bg-gold rounded-full" :style="{ width: `${summary.count ? (summary.stars[s] / summary.count) * 100 : 0}%` }" /></span>
              <span class="w-6 text-right tabular-nums">{{ summary.stars[s] }}</span>
            </li>
          </ul>
        </template>
        <p v-else class="text-ink-soft text-sm">No reviews yet. Be the first to share your thoughts.</p>
      </div>

      <div>
        <!-- the form -->
        <Transition enter-from-class="opacity-0 -translate-y-2" enter-active-class="transition duration-300" leave-to-class="opacity-0" leave-active-class="transition duration-200">
          <form v-if="open" class="rounded-2xl bg-white ring-1 ring-line p-6 mb-8" @submit.prevent="submit">
            <p v-if="!eligibility?.can_review" class="text-sm text-ink-soft">{{ eligibility?.reason }}</p>
            <template v-else>
              <p v-if="eligibility.mine" class="text-xs text-ink-faint mb-3">You reviewed this {{ eligibility.mine.status === 'approved' ? '' : '(waiting for approval)' }}: saving replaces it.</p>
              <div class="flex items-center gap-1" role="radiogroup" aria-label="Your rating" @mouseleave="hover = 0">
                <button v-for="i in 5" :key="i" type="button" role="radio" :aria-checked="form.rating === i" :aria-label="`${i} star${i === 1 ? '' : 's'}`" class="p-0.5" @mouseenter="hover = i" @click="form.rating = i">
                  <svg viewBox="0 0 24 24" class="w-7 h-7 transition" :class="(hover || form.rating) >= i ? 'text-gold scale-110' : 'text-line-strong'" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.94 6.1 6.56.93-4.75 4.62 1.12 6.53L12 17.6l-5.87 3.08 1.12-6.53L2.5 9.53l6.56-.93z" /></svg>
                </button>
              </div>
              <input v-model="form.title" class="s-input mt-4" maxlength="120" placeholder="A title (optional)" aria-label="Title">
              <textarea v-model="form.body" rows="4" class="s-input mt-3" maxlength="2000" placeholder="What did you think? Quality, fit, how it wears…" aria-label="Your review" required />
              <div class="flex items-center gap-3 mt-4">
                <button class="s-btn-dark" :disabled="busy">{{ busy ? 'Sending…' : 'Send review' }}</button>
                <button type="button" class="text-sm text-ink-soft hover:text-noir-800" @click="open = false">Cancel</button>
              </div>
            </template>
            <p v-if="error" class="text-sm text-sale mt-3">{{ error }}</p>
          </form>
        </Transition>
        <p v-if="error && !open" class="text-sm text-sale mb-4">{{ error }}</p>

        <ul class="divide-y divide-line">
          <li v-for="r in reviews" :key="r._id" v-reveal class="py-6 first:pt-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ProductStars :value="r.rating" />
              <span class="font-semibold text-noir-800">{{ r.name }}</span>
              <span v-if="r.verified" class="inline-flex items-center gap-1 text-xs text-green-700"><Icon name="lucide:badge-check" class="w-3.5 h-3.5" /> Verified buyer</span>
              <span class="text-xs text-ink-faint ml-auto">{{ date(r.created_at) }}</span>
            </div>
            <p v-if="r.title" class="mt-3 font-semibold text-noir-800">{{ r.title }}</p>
            <p class="mt-1.5 text-ink-soft leading-relaxed whitespace-pre-line">{{ r.body }}</p>
            <div v-if="r.reply" class="mt-4 rounded-xl bg-cream-deep/70 px-4 py-3 text-sm">
              <p class="text-xs font-semibold text-noir-800">{{ shop.name }} replied</p>
              <p class="text-ink-soft mt-1">{{ r.reply }}</p>
            </div>
          </li>
        </ul>
        <nav v-if="pages > 1" class="flex items-center gap-2 mt-4" aria-label="Review pages">
          <button class="s-chip !py-1.5" :disabled="page <= 1" @click="page--"><Icon name="lucide:chevron-left" class="w-4 h-4" /></button>
          <span class="text-sm text-ink-soft tabular-nums">Page {{ page }} of {{ pages }}</span>
          <button class="s-chip !py-1.5" :disabled="page >= pages" @click="page++"><Icon name="lucide:chevron-right" class="w-4 h-4" /></button>
        </nav>
      </div>
    </div>
  </section>
</template>
