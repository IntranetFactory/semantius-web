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
//
// ARRIVALS ARE SHAPED, NOT INSTANT. Two mechanisms, fixing two different startup artefacts:
//
//   1. RAMP (`RAMP_SECONDS`, default 30) — users arrive gradually rather than all at once. A
//      serverless backend scales on demand and needs a warmup; dropping the full user count on a
//      cold one produces a wall of `57014 statement timeout` in the first seconds even when the
//      steady-state load is comfortably within its ceiling. The probe never sees this because a
//      stepped ramp warms the backend on its way up.
//   2. JITTER (`startupJitter`) — each VU's first request is offset by a random fraction of one
//      user cycle, so users don't march in lockstep. Without it every VU fires the instant it
//      starts and stays phase-aligned for several cycles afterwards.
//
// Consequently the ramp window is a WARMUP, not a measurement. Requests are tagged
// `phase:ramp` / `phase:steady` and the summary reports them separately — a single blended
// number lets a clean steady state be reported as a failing run (or vice versa).
import exec from 'k6/execution'
import { mintToken } from '../lib/auth.js'
import { activeProfile, runSession, taggedThresholds } from '../lib/profiles.js'
import { THINK_MIN, THINK_MAX, startupJitter } from '../lib/http.js'

const USERS = Number(__ENV.USERS || 25)
const MINUTES = Number(__ENV.MINUTES || 1)
const RAMP_SECONDS = Number(__ENV.RAMP_SECONDS || 30)
const profile = activeProfile()

// Steady-state SLO, applied only to `phase:steady` — used for the verdict, not enforced as a
// hard k6 threshold (a `users` run characterises a given user count rather than gating on it).
const MAX_ERROR_RATE = Number(__ENV.MAX_ERROR_RATE || 0.01)
const MAX_P95_MS = Number(__ENV.MAX_P95_MS || 2000)

export const options = {
  scenarios: {
    users: {
      // ramping-vus, not constant-vus: hold USERS for the full MINUTES, but reach it over
      // RAMP_SECONDS first. The hold is the measured window; the ramp is warmup.
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: `${RAMP_SECONDS}s`, target: USERS },
        { duration: `${MINUTES}m`, target: USERS },
      ],
      gracefulRampDown: '10s',
    },
  },
  // Per-action rows, plus the ramp/steady split (thresholds are what make submetrics exist).
  thresholds: {
    ...taggedThresholds(profile),
    'http_req_failed{phase:steady}': ['rate>=0'],
    'http_req_duration{phase:steady}': ['max>=0'],
    'http_reqs{phase:steady}': ['count>=0'],
    'http_req_failed{phase:ramp}': ['rate>=0'],
    'http_req_duration{phase:ramp}': ['max>=0'],
    'http_reqs{phase:ramp}': ['count>=0'],
  },
}

export function setup() {
  console.log(
    `Simulating ${USERS} users · profile '${profile.label}' · think ${THINK_MIN}-${THINK_MAX}s/action · ` +
      `${RAMP_SECONDS}s ramp + ${MINUTES} min steady`,
  )
  return { token: mintToken() }
}

// Tagged per request (see runSession's tagsFor): a session spans ~30s, so its requests can
// straddle the ramp/steady boundary and must be attributed individually.
function currentPhaseTag() {
  const elapsed = (Date.now() - exec.scenario.startTime) / 1000
  return elapsed < RAMP_SECONDS ? 'ramp' : 'steady'
}

// One pass = one user's session (profile actions, thinking between each). The VU then loops.
export default function (data) {
  if (exec.vu.iterationInInstance === 0) startupJitter()
  runSession(data.token, profile, () => ({ phase: currentPhaseTag() }))
}

export function handleSummary(data) {
  const phase = (name) => {
    const failed = data.metrics[`http_req_failed{phase:${name}}`]?.values
    const dur = data.metrics[`http_req_duration{phase:${name}}`]?.values
    const reqs = data.metrics[`http_reqs{phase:${name}}`]?.values
    const seconds = name === 'ramp' ? RAMP_SECONDS : MINUTES * 60
    return {
      requests: reqs?.count ?? 0,
      rps: Number(((reqs?.count ?? 0) / seconds).toFixed(2)),
      errorPercent: Number(((failed?.rate ?? 0) * 100).toFixed(2)),
      p95Ms: dur?.['p(95)'] != null ? Math.round(dur['p(95)']) : null,
      avgMs: dur?.avg != null ? Math.round(dur.avg) : null,
    }
  }

  const ramp = phase('ramp')
  const steady = phase('steady')
  const healthy =
    steady.requests > 0 &&
    steady.errorPercent <= MAX_ERROR_RATE * 100 &&
    steady.p95Ms !== null &&
    steady.p95Ms <= MAX_P95_MS

  const row = (label, p) =>
    `    ${label.padEnd(8)} ${String(p.requests).padStart(6)} reqs  ` +
    `${String(p.rps).padStart(7)} req/s  err ${(p.errorPercent + '%').padEnd(7)} ` +
    `avg ${((p.avgMs ?? '—') + 'ms').padEnd(8)} p95 ${(p.p95Ms ?? '—') + 'ms'}`

  const verdict = healthy
    ? `    ✓ ${USERS} users SUSTAINED — steady state met err ≤ ${MAX_ERROR_RATE * 100}%, p95 ≤ ${MAX_P95_MS}ms.`
    : `    ✗ ${USERS} users NOT sustained — steady state breached the SLO (err ≤ ${MAX_ERROR_RATE * 100}%, p95 ≤ ${MAX_P95_MS}ms).\n` +
      `      Re-probe and run a lower count; the ceiling fluctuates run-to-run.`

  const rampNote =
    ramp.errorPercent > MAX_ERROR_RATE * 100
      ? `\n    Note: errors during ramp are warmup (cold backend scaling up), not a verdict on ${USERS} users.` +
        `\n          Raise RAMP_SECONDS if the ramp is consistently dirty.`
      : ''

  return {
    stdout:
      `\n  USERS RESULT (${USERS} users · profile '${profile.label}')\n\n` +
      `${row('ramp', ramp)}   ← warmup, excluded from the verdict\n` +
      `${row('steady', steady)}   ← the measurement\n\n${verdict}${rampNote}\n\n`,
  }
}
