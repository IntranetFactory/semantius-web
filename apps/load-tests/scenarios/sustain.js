// Phase 2 — sustain a fixed arrival rate for MINUTES minutes and characterise steady state.
//
// `load-test.sh peak` sets RATE from the peak the probe discovered, so nothing is tuned by
// hand. Can also be run directly: RATE=8 MINUTES=5 ./load-test.sh sustain
//
// The rate is in ITERATIONS/second; each iteration runs the three request types in sequence
// (orders-list → order → product), so total req/s ≈ 3 × RATE.
import { mintToken } from '../lib/auth.js'
import { getRandomOrdersPage, getRandomOrderById } from '../lib/orders.js'
import { getRandomProductById } from '../lib/products.js'

const RATE = Number(__ENV.RATE || 3) // iterations/s
const MINUTES = Number(__ENV.MINUTES || 1)
const MAX_VUS = Number(__ENV.MAX_VUS || 200)

export const options = {
  scenarios: {
    sustain: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: `${MINUTES}m`,
      preAllocatedVUs: Math.min(50, MAX_VUS),
      maxVUs: MAX_VUS,
    },
  },
  thresholds: {
    // Trivially-true thresholds on tagged metrics — surface a per-request-type sub-metric
    // row (latency + error rate) in the summary without gating pass/fail.
    'http_req_duration{name:orders-list}': ['max>=0'],
    'http_req_duration{name:order}': ['max>=0'],
    'http_req_duration{name:product}': ['max>=0'],
    'http_req_failed{name:orders-list}': ['rate>=0'],
    'http_req_failed{name:order}': ['rate>=0'],
    'http_req_failed{name:product}': ['rate>=0'],
  },
}

export function setup() {
  return { token: mintToken() }
}

// One iteration runs the three request types in sequence → within a VU: 1,2,3,1,2,3,…
export default function (data) {
  getRandomOrdersPage(data.token)
  getRandomOrderById(data.token)
  getRandomProductById(data.token)
}
