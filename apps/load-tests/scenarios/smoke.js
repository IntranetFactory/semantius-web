// Smoke test — validates auth + endpoint wiring before running the heavy peak test.
// 1 VU, a handful of iterations. Fails fast if the token exchange or endpoint is broken.
//
//   pnpm --filter @semantius/load-tests smoke
//   (or) dotenvx run -f ../../.env -- k6 run scenarios/smoke.js
import { sleep } from 'k6'
import { mintToken } from '../lib/auth.js'
import { getRandomOrdersPage, getRandomOrderById } from '../lib/orders.js'
import { getRandomProductById } from '../lib/products.js'

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
  },
}

export function setup() {
  return { token: mintToken() }
}

export default function (data) {
  getRandomOrdersPage(data.token)
  getRandomOrderById(data.token)
  getRandomProductById(data.token)
  sleep(0.5)
}
