<script setup>
// Two steps: email → 6 digit code from the inbox. Emits "done" once signed in. Only the email is asked: the name
// is asked once signed in, and only while the account has none (account page, checkout address).
defineProps({ compact: Boolean })
const emit = defineEmits(['done'])
const auth = useAuth()

const step = ref('email')
const email = ref('')
const code = ref('')
const busy = ref(false)
const error = ref('')
const devCode = ref('')
const resendIn = ref(0)
let timer
const tick = () => { clearInterval(timer); timer = setInterval(() => { if (resendIn.value > 0) resendIn.value--; else clearInterval(timer) }, 1000) }
onBeforeUnmount(() => clearInterval(timer))

const send = async () => {
  busy.value = true; error.value = ''
  try {
    const res = await auth.requestCode(email.value)
    devCode.value = res.data.dev_code || ''
    resendIn.value = res.data.resend_in || 60
    tick()
    step.value = 'code'
    nextTick(() => document.getElementById('otp-code')?.focus())
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
const verify = async () => {
  busy.value = true; error.value = ''
  try {
    const data = await auth.verifyCode(email.value, code.value)
    emit('done', data)
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <div>
    <form v-if="step === 'email'" class="space-y-4" @submit.prevent="send">
      <div>
        <label for="si-email" class="block text-sm font-medium mb-1.5">Email</label>
        <input id="si-email" v-model="email" type="email" inputmode="email" required autocomplete="email" autocapitalize="off" spellcheck="false" class="s-input" placeholder="you@example.com">
        <p class="text-xs text-ink-faint mt-1.5">We'll email you a 6 digit code. No password needed.</p>
      </div>
      <p v-if="error" class="text-sm text-sale" role="alert">{{ error }}</p>
      <button class="s-btn-dark w-full" :disabled="busy">{{ busy ? 'Sending…' : 'Send code' }}</button>
    </form>

    <form v-else class="space-y-4" @submit.prevent="verify">
      <p class="text-sm text-ink-soft">Enter the code we emailed to <strong class="text-ink break-all">{{ email }}</strong>. Check spam if it isn't there in a minute.
        <button type="button" class="text-noir-900 underline" @click="step = 'email'; code = ''">Change</button>
      </p>
      <p v-if="devCode" class="text-xs rounded-lg bg-gold/15 text-gold-deep px-3 py-2">Test mode: your code is <strong class="tabular-nums">{{ devCode }}</strong></p>
      <div>
        <label for="otp-code" class="sr-only">Code</label>
        <input id="otp-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required class="s-input text-center text-2xl tracking-[0.6em] tabular-nums" placeholder="••••••">
      </div>
      <p v-if="error" class="text-sm text-sale" role="alert">{{ error }}</p>
      <button class="s-btn-dark w-full" :disabled="busy || code.length < 6">{{ busy ? 'Checking…' : 'Continue' }}</button>
      <button type="button" class="w-full text-sm text-ink-soft disabled:opacity-50" :disabled="resendIn > 0 || busy" @click="send">
        {{ resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code' }}
      </button>
    </form>
  </div>
</template>
