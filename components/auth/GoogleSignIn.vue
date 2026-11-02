<script setup>
// The "Sign in with Google" button, drawn to Google's branding guidelines (developers.google.com/identity/branding-guidelines):
// the standard four colour G, approved wording only, Roboto Medium 14/20, 40px pill, 12px padding, 10px logo gap, and Google's
// light (#FFF / #747775 stroke / #1F1F1F) or dark (#131314 / #8E918F stroke / #E3E3E3) theme. Don't restyle it with
// brand colours or change the text or logo: Google reviews this for the OAuth consent screen.
const props = defineProps({
  theme: { type: String, default: 'light' }, // light | dark (dark on the noir header)
  text: { type: String, default: 'signin' }, // signin | continue
  block: Boolean, // full width
  next: { type: String, default: '' },
  back: { type: String, default: '' },
})
const auth = useAuth()
const label = computed(() => (props.text === 'continue' ? 'Continue with Google' : 'Sign in with Google'))
</script>

<template>
  <button
    type="button"
    class="gsi-btn"
    :class="[theme === 'dark' ? 'gsi-dark' : 'gsi-light', { 'w-full': block }]"
    :disabled="auth.googleBusy.value"
    :aria-busy="auth.googleBusy.value"
    @click="auth.signIn(next || undefined, back || undefined)"
  >
    <svg class="gsi-logo" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
    <span class="gsi-text">{{ label }}</span>
  </button>
</template>

<style scoped>
.gsi-btn {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 40px; padding: 0 12px; border-radius: 20px; border: 1px solid; white-space: nowrap; overflow: hidden;
  font-family: Roboto, Arial, sans-serif; font-weight: 500; font-size: 14px; line-height: 20px; letter-spacing: 0.25px;
  cursor: pointer; transition: background-color .218s, box-shadow .218s;
}
/* Google's state layer: the text colour at 8% on hover, 12% on focus/press */
.gsi-btn::before { content: ''; position: absolute; inset: 0; background: currentColor; opacity: 0; transition: opacity .218s; pointer-events: none; }
.gsi-btn:hover::before { opacity: .08; }
.gsi-btn:focus-visible::before, .gsi-btn:active::before { opacity: .12; }
.gsi-btn:hover { box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .3), 0 1px 3px 1px rgba(60, 64, 67, .15); }
.gsi-btn:disabled { cursor: progress; }
.gsi-light { background: #fff; border-color: #747775; color: #1f1f1f; }
.gsi-dark { background: #131314; border-color: #8e918f; color: #e3e3e3; }
.gsi-logo { width: 20px; height: 20px; flex-shrink: 0; position: relative; }
.gsi-text { position: relative; }
</style>
