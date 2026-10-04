<script setup>
await loadShop()
const shop = useShop()
useHead({
  titleTemplate: (t) => (t ? `${t} · ${shop.value.name}` : `${shop.value.name} · ${shop.value.tagline}`),
  meta: [{ name: 'description', content: () => shop.value.description }],
})
useSeoMeta({ ogSiteName: () => shop.value.name, ogType: 'website' })
</script>
<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
