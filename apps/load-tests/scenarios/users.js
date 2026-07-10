// Real-user model — 1 VU = 1 concurrent user, WITH think time.
//
// Unlike the throughput scenarios (probe/sustain, which hammer with no pauses), each VU here
// mimics a person: do an action, pause to read, do the next. So `USERS` concurrent VUs really
// does mean "USERS people using the app at once", and the resulting req/s is what that many
// real users actually generate.
//
//   ./load-test.sh users 30 5     # 30 concurrent users for 5 minutes (profile 'orders')
//   ./load-test.sh users analytics 30 5   # ...against the analytics profile
//   THINK_MIN=3 THINK_MAX=6 ./load-test.sh users 30 5   # "power users" stress case
//
// The session per iteration = the selected profile's actions, each followed by a random
// 8–12s think (avg 10s; see THINK_MIN/THINK_MAX). (USERS/MINUTES env vars are a fallback when
// the positional args are omitted.)
import { mintToken } from '../lib/auth.js'
import { activeProfile, runSession, taggedThresholds } from '../lib/profiles.js'
import { THINK_MIN, THINK_MAX } from '../lib/http.js'

const USERS = Number(__ENV.USERS || 25)
const MINUTES = Number(__ENV.MINUTES || 1)
const profile = activeProfile()

export const options = {
  scenarios: {
    users: {
      executor: 'constant-vus', // each VU loops the session independently = one user
      vus: USERS,
      duration: `${MINUTES}m`,
    },
  },
  thresholds: taggedThresholds(profile),
}

export function setup() {
  console.log(
    `Simulating ${USERS} users · profile '${profile.label}' · think ${THINK_MIN}-${THINK_MAX}s/action · ${MINUTES} min`,
  )
  return { token: mintToken() }
}

// One pass = one user's session (profile actions, thinking between each). The VU then loops.
export default function (data) {
  runSession(data.token, profile)
}
