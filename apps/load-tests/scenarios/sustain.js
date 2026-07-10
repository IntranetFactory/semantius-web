// Phase 2 — sustain a fixed arrival rate for MINUTES minutes and characterise steady state.
//
// `load-test.sh peak` sets RATE from the peak the probe discovered, so nothing is tuned by
// hand. Can also be run directly: RATE=8 MINUTES=5 ./load-test.sh sustain 5
//
// Runs whichever profile PROFILE selects (default 'orders'). The rate is in ITERATIONS/second;
// each iteration runs the profile's actions in sequence, so total req/s ≈ actions × RATE.
import { mintToken } from '../lib/auth.js'
import { activeProfile, runThroughput, taggedThresholds } from '../lib/profiles.js'

const RATE = Number(__ENV.RATE || 3) // iterations/s
const MINUTES = Number(__ENV.MINUTES || 1)
const MAX_VUS = Number(__ENV.MAX_VUS || 200)
const profile = activeProfile()

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
  thresholds: taggedThresholds(profile),
}

export function setup() {
  return { token: mintToken() }
}

export default function (data) {
  runThroughput(data.token, profile)
}
