// Shopping bag kept in the browser until checkout (the API cart is created at checkout).
// Line: { variant_id, product_id, slug, title, thumb, attrs, price, was, qty, max }

const KEY = 'ecom_bag_v1'

export function useCart() {
  const lines = useState('bag', () => [])
  // a gift box's card: kept with the bag, sent with the order
  const giftMessage = useState('bag-gift', () => '')
  const open = useState('bag-open', () => false)
  const loaded = useState('bag-loaded', () => false)

  if (import.meta.client && !loaded.value) {
    loaded.value = true
    try { lines.value = JSON.parse(localStorage.getItem(KEY) || '[]') } catch { lines.value = [] }
    watch(lines, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode */ } }, { deep: true })
    try { giftMessage.value = localStorage.getItem(`${KEY}_gift`) || '' } catch { /* private mode */ }
    watch(giftMessage, (v) => { try { v ? localStorage.setItem(`${KEY}_gift`, v) : localStorage.removeItem(`${KEY}_gift`) } catch { /* private mode */ } })
  }

  const count = computed(() => lines.value.reduce((n, l) => n + l.qty, 0))
  const subtotal = computed(() => lines.value.reduce((n, l) => n + l.qty * l.price, 0))

  const add = (line, qty = 1) => {
    // a known stock of 0 is sold out (only an unknown max means no limit)
    if (typeof line.max === 'number' && line.max <= 0) {
      useToast().show({ title: 'Sold out', body: line.title })
      return
    }
    const existing = lines.value.find((l) => l.variant_id === line.variant_id)
    const cap = (n) => (line.max > 0 ? Math.min(n, line.max) : n)
    if (existing) existing.qty = cap(existing.qty + qty)
    else lines.value.push({ ...line, qty: cap(qty) })
    // a toast, not the drawer: shoppers keep browsing and open the bag when they want
    const size = Object.values(line.attrs || {}).join(' · ')
    useToast().show({ title: 'Added to your bag', body: [line.title, size].filter(Boolean).join(' · '), image: line.thumb, action: { label: 'View bag', run: () => { open.value = true } } })
  }
  const setQty = (variantId, qty) => {
    const l = lines.value.find((x) => x.variant_id === variantId)
    if (!l) return
    if (qty <= 0) lines.value = lines.value.filter((x) => x.variant_id !== variantId)
    else l.qty = l.max > 0 ? Math.min(qty, l.max) : qty
  }
  const remove = (variantId) => { lines.value = lines.value.filter((x) => x.variant_id !== variantId) }
  const clear = () => { lines.value = []; giftMessage.value = '' }

  return { lines, open, count, subtotal, add, setQty, remove, clear, giftMessage }
}
