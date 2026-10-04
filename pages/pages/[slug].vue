<script setup>
// A content page written in the admin (Storefront → Pages), in Markdown.
const route = useRoute()
const shop = useShop()
const { data: page, error } = await useAsyncData(`page-${route.params.slug}`, async () => (await api(`/storefront/pages/${route.params.slug}`)).data)
if (error.value || !page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const html = computed(() => renderMarkdown(page.value.body))
useSeoMeta({ title: () => page.value.title, description: () => page.value.subtitle || page.value.body.slice(0, 150) })
</script>

<template>
  <div>
    <UiPageHero :eyebrow="page.eyebrow || shop.name" :title="page.title" :subtitle="page.subtitle" />
    <article v-reveal class="s-container max-w-3xl py-16 s-prose" v-html="html" />
    <div class="s-container max-w-3xl pb-20">
      <div class="rounded-2xl bg-white ring-1 ring-line p-6 flex flex-wrap items-center justify-between gap-4">
        <p class="text-ink-soft">Still have a question? We're happy to help.</p>
        <NuxtLink to="/contact" class="s-btn-dark !py-2.5">Contact us <Icon name="lucide:arrow-right" class="w-4 h-4" /></NuxtLink>
      </div>
    </div>
  </div>
</template>
