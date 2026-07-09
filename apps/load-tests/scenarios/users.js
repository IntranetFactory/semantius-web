// Real-user model — 1 VU = 1 concurrent user, WITH think time.
//
// Unlike the throughput scenarios (probe/sustain, which hammer with no pauses), each VU here
// mimics a person: do an action, pause to read, do the next. So `USERS` concurrent VUs really
// does mean "USERS people using the app at once", and the resulting req/s is what that many
// real users actually generate.
//
//   ./load-test.sh users 30 5     # 30 concurrent users for 5 minutes
//   THINK_MIN=3 THINK_MAX=6 ./load-test.sh users 30 5   # "power users" stress case
//
// (USERS/MINUTES env vars still work as a fallback when the positional args are omitted.)
//
// Session per iteration: open orders grid → think → open an order → think → open a product →
// think. Think time is a random 8–12s per action (avg 10s; see THINK_MIN/THINK_MAX).
import { mintToken } from '../lib/auth.js'
import { getRandomOrdersPage, getRandomOrderById } from '../lib/orders.js'
import { getRandomProductById } from '../lib/products.js'
import { think, THINK_MIN, THINK_MAX } from '../lib/http.js'

const USERS = Number(__ENV.USERS || 25)
const MINUTES = Number(__ENV.MINUTES || 1)

export const options = {
  scenarios: {
    users: {
      executor: 'constant-vus', // each VU loops the session independently = one user
      vus: USERS,
      duration: `${MINUTES}m`,
    },
  },
  thresholds: {
    // Trivially-true thresholds on tagged metrics — surface a per-action sub-metric row
    // (latency + error rate) in the summary without gating pass/fail.
    'http_req_duration{name:orders-list}': ['max>=0'],
    'http_req_duration{name:order}': ['max>=0'],
    'http_req_duration{name:product}': ['max>=0'],
    'http_req_failed{name:orders-list}': ['rate>=0'],
    'http_req_failed{name:order}': ['rate>=0'],
    'http_req_failed{name:product}': ['rate>=0'],
  },
}

export function setup() {
  console.log(
    `Simulating ${USERS} concurrent users · think ${THINK_MIN}-${THINK_MAX}s/action · ${MINUTES} min`,
  )
  return { token: mintToken() }
}

// One pass = one user's browse session. The VU then loops and does it again (same user).
export default function (data) {
  getRandomOrdersPage(data.token) // open the orders grid
  think()
  getRandomOrderById(data.token) // open an order record
  think()
  getRandomProductById(data.token) // open a product record
  think()
}
