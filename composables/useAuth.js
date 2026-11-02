// Customer session: token + user in cookies (readable during SSR for the header), Google sign-in.
const TOKEN = 'sc_token'
const USER = 'sc_user'
const GOOGLE = 'sc_google'

/** Only paths on this site (no //host or full urls) are followed after a sign-in. */
const safeNext = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : '/account')

export function useAuth() {
  const opts = { sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' }
  // cookies survive reloads (and are read during SSR); shared state keeps every component in step, since
  // separate useCookie() refs don't see each other's writes
  const tokenCookie = useCookie(TOKEN, opts)
  const userCookie = useCookie(USER, opts)
  const tokenState = useState('auth-token', () => tokenCookie.value || null)
  const userState = useState('auth-user', () => userCookie.value || null)
  const token = computed({ get: () => tokenState.value, set: (v) => { tokenState.value = v; tokenCookie.value = v } })
  const user = computed({ get: () => userState.value, set: (v) => { userState.value = v; userCookie.value = v } })
  const signedIn = computed(() => !!tokenState.value)

  /** Call the API as the signed in customer; a 401 signs out. */
  const request = async (path, { query, method = 'GET', body } = {}) => {
    try {
      return await $fetch(path, {
        baseURL: apiBase(), query: cleanQuery(query), method, body, retry: 0, timeout: 20000,
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
    } catch (e) {
      if (e?.response?.status === 401) { token.value = null; user.value = null }
      throw friendly(e)
    }
  }

  // Google: any "Sign in" button calls signIn(). We keep a random state (plus where to go after, and where to return if it
  // fails) in a short lived cookie, the API builds Google's consent page address, and Google sends the shopper to
  // /auth/google/callback, which calls finishGoogle() and goes straight on: no sign-in page of our own.
  const googleCookie = useCookie(GOOGLE, { sameSite: 'lax', maxAge: 60 * 10, path: '/' })
  const googleBusy = useState('auth-google-busy', () => false)
  const googleRedirect = () => `${window.location.origin}/auth/google/callback`
  const here = () => window.location.pathname + window.location.search
  /** Leave for Google; next = where to land once signed in (this page by default), back = where to return on cancel. */
  const signIn = async (next, back) => {
    if (googleBusy.value) return
    googleBusy.value = true
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(24))
      const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      googleCookie.value = { state, next: safeNext(next || here()), back: safeNext(back || here()) }
      const res = await api('/auth/google/url', { query: { redirect_uri: googleRedirect(), state } })
      window.location.assign(res.data.url)
    } catch (e) {
      googleBusy.value = false
      useToast().show({ title: "Couldn't open Google sign-in", body: friendly(e).message, icon: 'lucide:circle-alert', ms: 6000 })
    }
  }
  /** Finish a Google sign-in on the callback page: { next, isNew }. Errors carry `back` (and `cancelled`). */
  const finishGoogle = async ({ code, state, error }) => {
    const saved = googleCookie.value
    googleCookie.value = null
    const fail = (message, cancelled = false) => Object.assign(new Error(message), { back: safeNext(saved?.back || '/'), cancelled })
    if (error) throw fail(error === 'access_denied' ? 'Sign-in cancelled' : "Google sign-in didn't go through, try again", error === 'access_denied')
    if (!saved?.state || !state || saved.state !== state) throw fail('That sign-in took too long, try again')
    try {
      const res = await api('/auth/google', { method: 'POST', body: { code, redirect_uri: googleRedirect() } })
      token.value = res.data.token
      user.value = res.data.user
      return { next: safeNext(saved.next), isNew: !!res.data.is_new }
    } catch (e) { throw fail(friendly(e).message) }
  }
  const refreshMe = async () => {
    if (!token.value) return null
    const res = await request('/auth/me')
    user.value = res.data
    return res.data
  }
  const signOut = () => { token.value = null; user.value = null }

  return { token, user, signedIn, request, signIn, googleBusy, finishGoogle, refreshMe, signOut }
}

/** Turn an API error into an Error with a readable message and field errors. */
export function friendly(e) {
  const data = e?.data || e?.response?._data || {}
  const fields = data.error && typeof data.error === 'object' ? data.error : null
  const first = fields ? Object.values(fields).flat()[0] : ''
  const msg = first || (typeof data.error === 'string' ? data.error : '') || data.message || e?.message || 'Something went wrong'
  return Object.assign(new Error(msg.charAt(0).toUpperCase() + msg.slice(1)), { status: e?.response?.status, fields })
}
