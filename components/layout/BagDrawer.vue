<script setup>
const cart = useCart()
const close = () => { cart.open.value = false }
const onKey = (e) => { if (e.key === 'Escape') close() }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
useScrollLock(computed(() => cart.open.value))
const attrs = (a) => Object.values(a || {}).join(' · ')
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" enter-active-class="transition" leave-to-class="opacity-0" leave-active-class="transition">
      <div v-if="cart.open.value" class="fixed inset-0 z-50 bg-noir-950/50" @click.self="close">
        <aside class="absolute right-0 top-0 h-full w-[min(26rem,100vw)] bg-cream flex flex-col shadow-lift" role="dialog" aria-modal="true" aria-label="Your bag">
          <header class="flex items-center justify-between px-6 py-5 border-b border-line">
            <h2 class="font-display text-2xl text-noir-800">Your bag <span class="text-ink-faint text-base">({{ cart.count.value }})</span></h2>
            <button class="p-2 -mr-2" aria-label="Close bag" @click="close"><Icon name="lucide:x" class="w-6 h-6" /></button>
          </header>

          <div v-if="!cart.lines.value.length" class="flex-1 flex flex-col items-center justify-center text-center px-10">
            <Icon name="lucide:shopping-bag" class="w-10 h-10 text-gold-dark" />
            <p class="font-display text-xl mt-4">Your bag is empty</p>
            <p class="text-sm text-ink-soft mt-1">Have a look around, something will catch your eye.</p>
            <NuxtLink to="/products" class="s-btn-dark mt-6" @click="close">Start shopping</NuxtLink>
          </div>

          <ul v-else class="flex-1 overflow-y-auto divide-y divide-line px-6" data-lenis-prevent>
            <li v-for="l in cart.lines.value" :key="l.variant_id" class="py-5 flex gap-4">
              <NuxtLink :to="`/products/${l.slug}`" class="w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-white border border-line" @click="close">
                <img v-if="l.thumb" :src="l.thumb" :alt="l.title" class="w-full h-full object-contain p-1.5" loading="lazy">
              </NuxtLink>
              <div class="flex-1 min-w-0">
                <NuxtLink :to="`/products/${l.slug}`" class="font-medium leading-snug hover:underline" @click="close">{{ l.title }}</NuxtLink>
                <p v-if="attrs(l.attrs)" class="text-xs text-ink-faint mt-0.5">{{ attrs(l.attrs) }}</p>
                <div class="flex items-center justify-between mt-3">
                  <div class="inline-flex items-center rounded-full border border-line-strong">
                    <button class="p-2" aria-label="One less" @click="cart.setQty(l.variant_id, l.qty - 1)"><Icon name="lucide:minus" class="w-3.5 h-3.5" /></button>
                    <span class="w-6 text-center text-sm tabular-nums">{{ l.qty }}</span>
                    <button class="p-2" aria-label="One more" :disabled="l.max > 0 && l.qty >= l.max" @click="cart.setQty(l.variant_id, l.qty + 1)"><Icon name="lucide:plus" class="w-3.5 h-3.5" /></button>
                  </div>
                  <span class="font-semibold tabular-nums">{{ money(l.price * l.qty) }}</span>
                </div>
                <button class="text-xs text-ink-faint hover:text-sale mt-2" @click="cart.remove(l.variant_id)">Remove</button>
              </div>
            </li>
          </ul>

          <footer v-if="cart.lines.value.length" class="border-t border-line px-6 py-5 space-y-3 bg-white">
            <div class="flex justify-between text-sm"><span class="text-ink-soft">Subtotal</span><span class="font-semibold tabular-nums">{{ money(cart.subtotal.value) }}</span></div>
            <p class="text-xs text-ink-faint">Delivery and any offers are worked out at checkout.</p>
            <NuxtLink to="/checkout" class="s-btn-dark w-full" @click="close">Checkout</NuxtLink>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
