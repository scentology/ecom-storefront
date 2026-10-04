// Wishlist. Guests: product ids in localStorage. Signed in: the API list (`/wishlist`) is the source of truth;
// on sign-in (or app start while signed in) the local ids are merged into it and the local list is cleared.
// items: [{ product_id, variant_id, added_at, product }] (guests: product/variant are null, the page fetches them)
const KEY = 'ecom_saved_v1'

export function useWishlist() {
  const local = useState('saved', () => [])
  // null until the server list is loaded (and whenever signed out)
  const server = useState('wishlist-server', () => null)
  const loaded = useState('saved-loaded', () => false)
  const auth = useAuth()

  if (import.meta.client && !loaded.value) {
    loaded.value = true
    try { local.value = JSON.parse(localStorage.getItem(KEY) || '[]') } catch { local.value = [] }
    // a detached scope: these watchers outlive whichever component called first
    effectScope(true).run(() => {
      watch(local, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode */ } }, { deep: true })
      watch(() => auth.token.value, (t) => { server.value = null; if (t) sync(auth, local, server) }, { immediate: true })
    })
  }

  const remote = computed(() => auth.signedIn.value && server.value !== null)
  const items = computed(() => (remote.value ? server.value : local.value.map((id) => ({ product_id: id, variant_id: null, added_at: null, product: null }))))
  const ids = computed(() => items.value.map((i) => i.product_id))
  // false while a signed-in list is still loading
  const ready = computed(() => !auth.signedIn.value || server.value !== null)
  const has = (id) => ids.value.includes(id)

  /** Save or unsave a product; signed in, the change is shown at once and rolled back if the API refuses it. */
  const toggle = async (id, variantId = null, product = null) => {
    const adding = !has(id)
    const toast = useToast()
    const done = () => toast.show(adding
      ? { title: 'Added to your wishlist', icon: 'lucide:heart', action: { label: 'See wishlist', to: '/wishlist' }, ms: 2600 }
      : { title: 'Removed from your wishlist', icon: 'lucide:heart-off', ms: 2000 })
    if (!remote.value) {
      local.value = adding ? [...local.value, id] : local.value.filter((x) => x !== id)
      return done()
    }
    const at = server.value.findIndex((i) => i.product_id === id)
    const old = server.value[at]
    server.value = adding
      ? [{ product_id: id, variant_id: variantId || null, added_at: new Date().toISOString(), product }, ...server.value]
      : server.value.filter((i) => i.product_id !== id)
    done()
    try {
      if (adding) {
        await auth.request(`/wishlist/${id}`, { method: 'PUT', body: variantId ? { variant_id: variantId } : {} })
        // saved without the product at hand (or the API may have trimmed it): reload to get the full entry
        if (!product) refresh()
      } else await auth.request(`/wishlist/${id}`, { method: 'DELETE' })
    } catch (e) {
      if (server.value === null) return // signed out meanwhile
      if (adding) server.value = server.value.filter((i) => i.product_id !== id)
      else if (old && !server.value.some((i) => i.product_id === id)) {
        const list = [...server.value]
        list.splice(Math.min(at, list.length), 0, old)
        server.value = list
      }
      toast.show({ title: adding ? 'Couldn’t add to your wishlist' : 'Couldn’t remove it from your wishlist', body: e.message, icon: 'lucide:circle-alert', ms: 4000 })
    }
  }

  const refresh = async () => {
    if (!auth.signedIn.value) return
    const t = auth.token.value
    try {
      const res = await auth.request('/wishlist')
      if (auth.token.value === t) server.value = res.data || []
    } catch { /* keep what we have */ }
  }

  return { ids, items, ready, has, toggle, refresh }
}

// merge the local ids into the account's list, then use the account's list
async function sync(auth, local, server) {
  const t = auth.token.value
  const ids = [...local.value]
  let res = null
  if (ids.length) {
    try {
      res = await auth.request('/wishlist/merge', { method: 'POST', body: { product_ids: ids } })
      local.value = local.value.filter((id) => !ids.includes(id))
    } catch { /* e.g. the list is full: keep the local ids, show the account's list */ }
  }
  if (!res) res = await auth.request('/wishlist').catch(() => null)
  // still the same session (not signed out or switched while waiting)
  if (auth.token.value === t && res) server.value = res.data || []
}
