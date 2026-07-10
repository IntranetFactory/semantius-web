import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

// Simulated user "think time" between actions (reading the screen before the next click).
// Random per call so users don't march in lockstep. Defaults 8–12s (avg 10s); override
// THINK_MIN/THINK_MAX to model faster power users (e.g. 3–6s) as a stress case.
export const THINK_MIN = Number(__ENV.THINK_MIN || 8)
export const THINK_MAX = Number(__ENV.THINK_MAX || 12)
export function think() {
  sleep(THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN))
}

// Neon PostgREST data API. Overridable via LOADTEST_API_HOST so the same tests can be
// pointed at another instance without editing code.
export const API_HOST =
  __ENV.LOADTEST_API_HOST || 'https://ep-flat-cloud-an449mj3.apirest.c-6.us-east-1.aws.neon.tech'
export const REST_BASE = `${API_HOST}/neondb/rest/v1`

// Counter broken down by {status, name}. Built-in http metrics are tagged at request
// time (before the status is known), so a response-status breakdown needs a custom metric
// incremented afterwards. Visible in `--out json`/`handleSummary`.
const responsesByStatus = new Counter('responses_by_status')

// Per-VU record of {name}:{status} already logged, so a saturation run reports each distinct
// failure code (400 conn-limit / 500 timeout / 0 timeout …) once per request-type per VU
// instead of flooding the log. VUs are isolated JS runtimes with no shared state, so per-VU
// is the tightest in-script dedup possible.
const seenStatuses = new Set()

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function record(res, name) {
  // Break responses down by status code (status 0 = connection error / timeout in k6).
  responsesByStatus.add(1, { status: String(res.status), name })
  check(res, { 'status is 200': (r) => r.status === 200 }, { name })
  const key = `${name}:${res.status}`
  if (res.status !== 200 && !seenStatuses.has(key)) {
    seenStatuses.add(key)
    console.warn(`${name} non-200: status=${res.status} body=${(res.body || '').slice(0, 200)}`)
  }
  return res
}

// Perform one tagged request from a descriptor `{ method, url, body? }` with the bearer token.
// `name` tags the request so each action gets its own metric row in the summary. Handles GET
// and POST (a `body` implies JSON). Returns the k6 response. This is the single request path
// used by every profile action.
export function apiRequest(token, name, req) {
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(req.body ? { 'Content-Type': 'application/json' } : {}),
    },
    tags: { name },
  }
  const res = req.method === 'POST' ? http.post(req.url, req.body, params) : http.get(req.url, params)
  return record(res, name)
}
