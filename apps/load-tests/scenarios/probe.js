// Phase 1 — discover the endpoint's peak throughput automatically.
//
// Floods the API at a constant, deliberately-overloaded arrival rate for a short window.
// The endpoint serves up to its ceiling and sheds the rest (HTTP 400 "Too many
// connections"), so the *successful* request rate over the window IS the sustainable peak.
// handleSummary writes that discovered rate to .probe-result.json for load-test.sh to read
// and feed into the sustain phase — no manual tuning.
import { mintToken } from '../lib/auth.js'
import { getRandomOrdersPage, getRandomOrderById } from '../lib/orders.js'
import { getRandomProductById } from '../lib/products.js'

const PROBE_RATE = Number(__ENV.PROBE_RATE || 25) // iterations/s demanded (intentional overload)
const PROBE_DURATION = __ENV.PROBE_DURATION || '30s'
const MAX_VUS = Number(__ENV.MAX_VUS || 300)
const REQS_PER_ITER = 3 // orders-list + order + product

export const options = {
  scenarios: {
    probe: {
      executor: 'constant-arrival-rate',
      rate: PROBE_RATE,
      timeUnit: '1s',
      duration: PROBE_DURATION,
      preAllocatedVUs: Math.min(60, MAX_VUS),
      maxVUs: MAX_VUS,
    },
  },
}

export function setup() {
  return { token: mintToken() }
}

export default function (data) {
  getRandomOrdersPage(data.token)
  getRandomOrderById(data.token)
  getRandomProductById(data.token)
}

// Compute the sustainable peak from the flood and emit it as a machine-readable file.
export function handleSummary(data) {
  const reqRate = data.metrics.http_reqs?.values?.rate ?? 0 // total req/s over the window
  const failRate = data.metrics.http_req_failed?.values?.rate ?? 0 // 0..1 shed proportion
  const successRps = reqRate * (1 - failRate) // req/s the endpoint actually served OK
  const peakIters = successRps / REQS_PER_ITER // → arrival rate for the sustain phase

  const result = {
    successRps: Number(successRps.toFixed(2)),
    peakIters: Number(peakIters.toFixed(2)),
    demandedRps: PROBE_RATE * REQS_PER_ITER,
    shedPercent: Number((failRate * 100).toFixed(1)),
  }

  return {
    stdout:
      `\n  PROBE RESULT\n` +
      `    demanded ......: ${result.demandedRps} req/s (${PROBE_RATE} iters/s)\n` +
      `    shed ..........: ${result.shedPercent}%\n` +
      `    sustainable ...: ${result.successRps} req/s  →  ${result.peakIters} iters/s\n\n`,
    '.probe-result.json': JSON.stringify(result),
  }
}
