<script setup>
// Google sends the shopper here with ?code&state (or ?error). Only a moment's spinner: on success straight on to where they
// were going with a welcome toast, on failure back to where they started with the reason. The toast is shown once the
// next page is in (its own load would otherwise eat the toast's time). Done in onMounted (browser only): a code works once.
useHead({ title: 'Signing in', meta: [{ name: 'robots', content: 'noindex' }] })
const route = useRoute()
const auth = useAuth()
const toast = useToast() // here, not after an await: Nuxt's context is gone by then

onMounted(async () => {
  const q = route.query
  try {
    const { next, isNew } = await auth.finishGoogle({ code: String(q.code || ''), state: String(q.state || ''), error: q.error ? String(q.error) : '' })
    await navigateTo(next, { replace: true })
    const first = auth.user.value?.name?.split(' ')[0]
    toast.show(isNew
      ? { title: first ? `Welcome to Scentology, ${first}` : 'Welcome to Scentology', body: "You're signed in. Your account is ready.", icon: 'lucide:sparkles', ms: 5000 }
      : { title: first ? `Welcome back, ${first}` : 'Welcome back', body: `Signed in as ${auth.user.value?.email || ''}`, icon: 'lucide:circle-check', ms: 5000 })
  } catch (e) {
    await navigateTo(e.back || '/', { replace: true })
    if (!e.cancelled) toast.show({ title: "Couldn't sign you in", body: e.message, icon: 'lucide:circle-alert', ms: 10000 })
  }
})
</script>

<template>
  <section class="s-container py-32 sm:py-40 flex flex-col items-center" aria-live="polite">
    <span class="w-8 h-8 rounded-full border-2 border-line border-t-noir-900 animate-spin" aria-hidden="true" />
    <p class="mt-5 text-ink-soft">Signing you in…</p>
  </section>
</template>
