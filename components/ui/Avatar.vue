<script setup>
// A customer's round photo (from their Google account), or their initials on gold when there's none or it won't load.
// no-referrer: Google's photo host (lh3.googleusercontent.com) can refuse requests that carry another site's referrer.
const props = defineProps({ user: { type: Object, default: null } })
const failed = ref(false)
const img = ref(null)
const src = computed(() => props.user?.picture || '')
watch(src, () => { failed.value = false })
// server rendered: the photo can fail before Vue attaches @error, so check once mounted too
onMounted(() => { if (img.value?.complete && !img.value.naturalWidth) failed.value = true })
const initials = computed(() => {
  const name = (props.user?.name || props.user?.email || '').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '·'
})
</script>

<template>
  <span class="relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-gold-light to-gold-dark text-noir-900 font-semibold select-none">
    <img v-if="src && !failed" ref="img" :src="src" alt="" referrerpolicy="no-referrer" class="w-full h-full object-cover" @error="failed = true">
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
