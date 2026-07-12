/**
 * Dev/test auth bootstrap — lets an automated harness hand the app a ready
 * access token via a URL hash fragment (`https://…/#jwt=<token>`), so the app
 * boots already-authenticated and skips the interactive OAuth2 PKCE redirect.
 *
 * The token is exchanged out-of-band from a Semantius API key (see
 * `src/test/exchangeApiKeyForToken.ts`) and never touches the bundle — it rides
 * in the fragment, which browsers do NOT send to the server, so it stays out of
 * worker/CDN logs. We read it synchronously here (before AuthProvider's storage
 * initializers run), seed the same localStorage keys react-oauth2-code-pkce
 * already reads (prefix `SC_<mode>_`), then strip the fragment from the URL.
 *
 * GATING — both must hold, deny-by-default, so production is never affected:
 *   1. Build is a fixed-tenant test/preview build. Production derives the tenant
 *      from the subdomain at runtime and therefore has NO baked-in
 *      VITE_CONTROL_PLANE_ORG (see getTenantName() in lib/config.ts), so a
 *      non-empty value is an unforgeable build-time marker of a test build.
 *   2. Origin is localhost or a Cloudflare preview (`*.workers.dev`).
 * hostname is the browser's real origin and cannot be spoofed by a link.
 */
import { runtimeEnv } from './runtimeEnv'

function urlTokenAllowed(host: string): boolean {
  // Runtime-aware like the rest of the app (window.__ENV__ wins in Docker); the
  // host gate below still restricts #jwt to localhost/*.workers.dev regardless.
  const isTestBuild = !!(runtimeEnv('VITE_CONTROL_PLANE_ORG', import.meta.env.VITE_CONTROL_PLANE_ORG) ?? '').trim()
  const isDevOrPreviewHost =
    host === 'localhost' || host === '127.0.0.1' || host.endsWith('.workers.dev')
  return isTestBuild && isDevOrPreviewHost
}

export function applyDevUrlToken(): void {
  if (typeof window === 'undefined') return
  if (!urlTokenAllowed(window.location.hostname)) return

  const jwt = new URLSearchParams(window.location.hash.slice(1)).get('jwt')
  if (!jwt) return

  try {
    const prefix = `SC_${import.meta.env.MODE}_`
    const { exp } = JSON.parse(atob(jwt.split('.')[1])) as { exp: number }
    localStorage.setItem(`${prefix}token`, JSON.stringify(jwt))
    localStorage.setItem(`${prefix}tokenExpire`, String(exp))
    // Strip #jwt so the token doesn't linger in the address bar / history.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  } catch (err) {
    console.warn('[devUrlToken] ignored malformed #jwt token:', err)
  }
}
