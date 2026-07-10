// Smoke test — validates auth + endpoint wiring for the selected profile before running the
// heavy tests. 1 VU, a handful of iterations. Fails fast if the token exchange or any of the
// profile's requests are broken.
//
//   ./load-test.sh smoke                # profile 'orders'
//   ./load-test.sh smoke analytics      # profile 'analytics'
import { sleep } from 'k6'
import { mintToken } from '../lib/auth.js'
import { activeProfile, runThroughput } from '../lib/profiles.js'

const profile = activeProfile()

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
  runThroughput(data.token, profile)
  sleep(0.5)
}
