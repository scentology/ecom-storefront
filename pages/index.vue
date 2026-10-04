<script setup>
// The home page, arranged in the admin (Storefront → Home): each section type has its component.
const { data: home } = await useAsyncData('home', async () => (await api('/storefront/home')).data, { default: () => ({ sections: [] }) })
const components = {
  hero: resolveComponent('HomeHero'), split: resolveComponent('HomeSplit'), brands: resolveComponent('HomeBrands'), combos: resolveComponent('HomeCombos'),
  products: resolveComponent('HomeProducts'), cards: resolveComponent('HomeCards'), curated: resolveComponent('HomeCurated'), stats: resolveComponent('HomeStats'),
  testimonials: resolveComponent('HomeTestimonials'), faq: resolveComponent('HomeFaq'),
}
const shop = useShop()
useSeoMeta({ ogTitle: () => shop.value.name, description: () => shop.value.description })
</script>

<template>
  <div>
    <template v-for="s in home.sections" :key="s.id">
      <component :is="components[s.type]" v-if="components[s.type]" :section="s" />
    </template>
    <p v-if="!home.sections.length" class="s-container py-32 text-center text-ink-soft">The shop is being arranged. <NuxtLink to="/products" class="underline">See everything</NuxtLink></p>
  </div>
</template>
