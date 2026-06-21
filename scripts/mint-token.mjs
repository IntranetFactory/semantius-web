/**
 * Mint a Semantius test access token (client_credentials grant) and print it to
 * stdout, for handing to the app via a `#jwt=` URL fragment in automated runs.
 *
 *   TOKEN=$(dotenvx run -- node scripts/mint-token.mjs)
 *   agent-browser open "$PREVIEW_URL/#jwt=$TOKEN"
 *
 * Mirrors apps/web/src/test/exchangeApiKeyForToken.ts (kept dependency-free here
 * so it runs under plain `node` without a TS toolchain). Reads SEMANTIUS_API_KEY
 * (Node-only secret, never VITE_-prefixed) and reuses VITE_CONTROL_PLANE_ORG as
 * the org slug. Portable: no filesystem, no hardcoded temp paths.
 */
const apiKey = process.env.SEMANTIUS_API_KEY
const orgSlug = process.env.VITE_CONTROL_PLANE_ORG

if (!apiKey) {
  console.error('mint-token: missing SEMANTIUS_API_KEY (run via `dotenvx run --`)')
  process.exit(1)
}
if (!orgSlug) {
  console.error('mint-token: missing VITE_CONTROL_PLANE_ORG')
  process.exit(1)
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
  console.error(`mint-token: ${res.status} ${res.statusText} from ${url}\n${await res.text().catch(() => '')}`)
  process.exit(1)
}

const { access_token } = await res.json()
if (!access_token) {
  console.error(`mint-token: response from ${url} had no access_token`)
  process.exit(1)
}
process.stdout.write(access_token)
