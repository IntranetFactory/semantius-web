/**
 * Test/automation auth helper — exchanges a Semantius API key for an OAuth2
 * access token via the client_credentials grant, bypassing the interactive
 * PKCE login flow.
 *
 * This runs in a Node context (test harness / scripts), NOT in the browser
 * bundle: SEMANTIUS_API_KEY is intentionally NOT `VITE_`-prefixed so it is
 * never exposed to client code. The org slug is reused from
 * VITE_CONTROL_PLANE_ORG so we don't duplicate the value.
 *
 * Usage:
 *   const { access_token } = await exchangeApiKeyForToken()
 * then inject the token into the app's storage (prefix `SC_<mode>_`) so the
 * app boots already-authenticated. See CONTEXT-MEMORY.md "Automated test auth".
 */

export interface TokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
  scope?: string
  [key: string]: unknown
}

export interface ExchangeOptions {
  /** API key. Defaults to process.env.SEMANTIUS_API_KEY. */
  apiKey?: string
  /** Org slug. Defaults to process.env.VITE_CONTROL_PLANE_ORG. */
  orgSlug?: string
}

/**
 * POST https://{orgSlug}.semantius.cloud/token
 *   Content-Type: application/x-www-form-urlencoded
 *   x-api-key: <apiKey>
 *   body: grant_type=client_credentials
 */
export async function exchangeApiKeyForToken(
  opts: ExchangeOptions = {}
): Promise<TokenResponse> {
  const apiKey = opts.apiKey ?? process.env.SEMANTIUS_API_KEY
  const orgSlug = opts.orgSlug ?? process.env.VITE_CONTROL_PLANE_ORG

  if (!apiKey) {
    throw new Error(
      'exchangeApiKeyForToken: missing API key (set SEMANTIUS_API_KEY, run via `dotenvx run --`)'
    )
  }
  if (!orgSlug) {
    throw new Error(
      'exchangeApiKeyForToken: missing org slug (set VITE_CONTROL_PLANE_ORG)'
    )
  }

  const url = `https://${orgSlug}.semantius.cloud/token`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': apiKey,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `exchangeApiKeyForToken: ${res.status} ${res.statusText} from ${url}${detail ? ` — ${detail}` : ''}`
    )
  }

  const data = (await res.json()) as TokenResponse
  if (!data.access_token) {
    throw new Error(
      `exchangeApiKeyForToken: response from ${url} had no access_token`
    )
  }
  return data
}
