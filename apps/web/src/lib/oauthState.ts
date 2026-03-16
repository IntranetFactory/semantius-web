/**
 * OAuth state parameter with CSRF protection.
 *
 * Encodes both a random nonce (for CSRF) and the redirect path into the
 * OAuth `state` parameter. The library (`react-oauth2-code-pkce`) stores
 * the full state string in localStorage and validates it on callback,
 * so the nonce is verified automatically.
 *
 * Format: `<nonce>:<redirectPath>`
 */

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildOAuthState(redirectPath: string): string {
  return `${generateNonce()}:${redirectPath}`
}

export function parseOAuthState(state: string | null): string {
  if (!state) return '/'
  const colonIdx = state.indexOf(':')
  if (colonIdx === -1) return state // legacy plain-path state
  return state.slice(colonIdx + 1) || '/'
}
