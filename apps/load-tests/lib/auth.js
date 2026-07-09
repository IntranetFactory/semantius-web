import http from 'k6/http'

// k6-native port of scripts/mint-token.mjs (and apps/web/src/test/exchangeApiKeyForToken.ts).
// k6 runs on its own JS runtime (goja), NOT Node — it cannot `import` the .mjs script, so the
// client_credentials exchange is reimplemented here against the SAME token endpoint.
//
// Reads secrets from __ENV, so this must be run with dotenvx injecting the encrypted .env:
//   dotenvx run -f ../../.env -- k6 run scenarios/peak.js
//
// First iteration mints a single token for one service user (called once in setup()).
// When we later need multiple users, return an array here and pick per-VU in the scenario.
export function mintToken() {
  const org = __ENV.VITE_CONTROL_PLANE_ORG
  const apiKey = __ENV.SEMANTIUS_API_KEY
  if (!org) throw new Error('mintToken: missing VITE_CONTROL_PLANE_ORG')
  if (!apiKey) {
    throw new Error('mintToken: missing SEMANTIUS_API_KEY — run via `dotenvx run -f ../../.env -- k6 run ...`')
  }

  const res = http.post(
    `https://${org}.semantius.cloud/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': apiKey,
      },
      tags: { name: 'token-exchange' },
    },
  )

  if (res.status !== 200) {
    throw new Error(`mintToken: token exchange failed ${res.status} — ${res.body}`)
  }
  const token = res.json('access_token')
  if (!token) throw new Error('mintToken: response had no access_token')
  return token
}
