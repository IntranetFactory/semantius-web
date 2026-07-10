import { apiRequest, think } from './http.js'
import { ordersListRequest, orderRequest } from './orders.js'
import { productRequest } from './products.js'
import { analyticsBatchRequest } from './analytics.js'

// A LOAD PROFILE is the request mix run per iteration — an ordered list of `actions`, each a
// named request builder. Every scenario (probe/sustain/users) runs the SELECTED profile, so
// `orders` and `analytics` are interchangeable and new/combined profiles are easy to add here.
//
// Select with the PROFILE env var (default 'orders'); via load-test.sh it's the optional word
// after the scenario, e.g. `./load-test.sh maxusers analytics 5`.
export const PROFILES = {
  orders: {
    label: 'orders',
    actions: [
      { name: 'orders-list', build: ordersListRequest }, // open the orders grid
      { name: 'order', build: orderRequest }, //            open an order record
      { name: 'product', build: productRequest }, //        open a product record
    ],
  },
  analytics: {
    label: 'analytics',
    actions: [
      { name: 'analytics', build: analyticsBatchRequest }, // Cube query batch (POST)
    ],
  },
  // Future: combined profiles, e.g. mixing orders + analytics actions in one session.
}

export function getProfile(name) {
  const key = name || 'orders'
  const p = PROFILES[key]
  if (!p) {
    throw new Error(`unknown PROFILE '${key}'. Available: ${Object.keys(PROFILES).join(', ')}`)
  }
  return p
}

// The profile selected by __ENV.PROFILE (default 'orders').
export function activeProfile() {
  return getProfile(__ENV.PROFILE)
}

export function requestsPerIteration(profile) {
  return profile.actions.length
}

// Throughput mode (probe/sustain): fire every action back-to-back, no pauses.
export function runThroughput(token, profile) {
  for (const a of profile.actions) apiRequest(token, a.name, a.build())
}

// Session mode (users): one action, then think — repeated. Models a real person reading
// between clicks, so one request per (think + active) regardless of how many actions.
export function runSession(token, profile) {
  for (const a of profile.actions) {
    apiRequest(token, a.name, a.build())
    think()
  }
}

// Trivially-true thresholds per action, so the summary breaks latency/errors down by action.
export function taggedThresholds(profile) {
  const t = {}
  for (const a of profile.actions) {
    t[`http_req_duration{name:${a.name}}`] = ['max>=0']
    t[`http_req_failed{name:${a.name}}`] = ['rate>=0']
  }
  return t
}
