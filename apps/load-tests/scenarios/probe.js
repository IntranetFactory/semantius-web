// Phase 1 — discover the selected profile's peak sustainable throughput automatically.
//
// METHOD: a STEPPED RAMP. The rate is raised one flat step at a time and each step is scored
// independently; the ceiling is the highest step that still met the SLO (error rate, p95
// latency) *and* whose demanded rate was actually delivered. The walk stops at the first step
// that fails, so the answer is the last good rung of a monotone climb.
//
// WHY NOT A SINGLE OVERLOAD FLOOD (the previous method): it assumed the backend sheds excess
// load *cheaply and instantly* — true when the endpoint had a hard connection cap that answered
// `400 Too many connections` in microseconds, so "successful req/s while overloaded" really was
// the ceiling. A backend that scales by QUEUEING instead of rejecting breaks that assumption
// completely: past its knee, latency grows without bound, requests time out rather than fail
// fast, the arrival-rate executor exhausts its VU pool, and measured success rate collapses
// toward zero. Throughput-under-overload is therefore NON-MONOTONIC — it rises to the knee and
// then falls off a cliff — so a single sample taken past the cliff reports a near-zero ceiling
// for a backend that is in fact faster than before. Never infer capacity from one overloaded
// sample; walk up to the knee and stop there.
//
// handleSummary writes the winning step to .probe-result.json for load-test.sh to feed into the
// sustain / users phase — no manual tuning.
//
// Runs whichever profile PROFILE selects (default 'orders'); e.g. PROFILE=analytics.
//
// Tunables: STEP_START, STEP_SIZE, STEP_COUNT, STEP_SECONDS, STEP_WARMUP, MAX_VUS,
//           MAX_ERROR_RATE, MAX_P95_MS, MIN_DELIVERY, REQ_TIMEOUT.
import exec from 'k6/execution'
import { mintToken } from '../lib/auth.js'
import { activeProfile, runThroughput, requestsPerIteration } from '../lib/profiles.js'

const STEP_START = Number(__ENV.STEP_START || 3) // iterations/s on the first rung
const STEP_SIZE = Number(__ENV.STEP_SIZE || 3) //   iterations/s added per rung
const STEP_COUNT = Number(__ENV.STEP_COUNT || 8) //  number of rungs
const STEP_SECONDS = Number(__ENV.STEP_SECONDS || 20) // wall time per rung
const STEP_WARMUP = Number(__ENV.STEP_WARMUP || 5) //  leading seconds of each rung discarded
const MAX_VUS = Number(__ENV.MAX_VUS || 400)

// SLO defining "sustainable". A rung passes only if all three hold.
const MAX_ERROR_RATE = Number(__ENV.MAX_ERROR_RATE || 0.01) // ≤1% non-200
const MAX_P95_MS = Number(__ENV.MAX_P95_MS || 2000) //         p95 latency budget
// The load generator must actually have applied the demanded rate. If it fell short we ran out
// of VUs (or the client is the bottleneck), so a low error rate on that rung proves nothing.
const MIN_DELIVERY = Number(__ENV.MIN_DELIVERY || 0.9)

const profile = activeProfile()
const REQS_PER_ITER = requestsPerIteration(profile)
const RATES = Array.from({ length: STEP_COUNT }, (_, i) => STEP_START + i * STEP_SIZE)
const MEASURED_SECONDS = Math.max(1, STEP_SECONDS - STEP_WARMUP)

// A flat rung in `ramping-arrival-rate` = a 0s stage that jumps to the target, then a stage
// that holds it. (A single stage would ramp linearly to the target instead of holding it.)
const stages = []
for (const rate of RATES) {
  stages.push({ duration: '0s', target: rate })
  stages.push({ duration: `${STEP_SECONDS}s`, target: rate })
}

// Per-rung submetrics only exist in handleSummary if a threshold references them, so declare a
// trivially-true threshold per rung per metric. This is how each step gets scored separately.
const thresholds = {}
RATES.forEach((_, i) => {
  thresholds[`http_req_failed{step:${i}}`] = ['rate>=0']
  thresholds[`http_req_duration{step:${i}}`] = ['max>=0']
  thresholds[`http_reqs{step:${i}}`] = ['count>=0']
})

export const options = {
  scenarios: {
    probe: {
      executor: 'ramping-arrival-rate',
      startRate: RATES[0],
      timeUnit: '1s',
      preAllocatedVUs: Math.min(60, MAX_VUS),
      maxVUs: MAX_VUS,
      stages,
      gracefulStop: '15s',
    },
  },
  thresholds,
}

export function setup() {
  const top = RATES[RATES.length - 1]
  console.log(
    `Stepped probe · profile '${profile.label}' · ${RATES.length} rungs ` +
      `${RATES[0]}→${top} iters/s (${RATES[0] * REQS_PER_ITER}→${top * REQS_PER_ITER} req/s) ` +
      `· ${STEP_SECONDS}s each · SLO err≤${MAX_ERROR_RATE * 100}% p95≤${MAX_P95_MS}ms`,
  )
  return { token: mintToken() }
}

// Which rung is this request part of? Requests are tagged at send time, so an iteration that
// spills past a rung boundary is still attributed to the rung that issued it. The first
// STEP_WARMUP seconds of each rung are tagged 'warmup' and excluded from scoring, so a rung is
// judged on its steady state rather than on the transient right after the rate jumps.
function currentStepTag() {
  const elapsed = (Date.now() - exec.scenario.startTime) / 1000
  const idx = Math.floor(elapsed / STEP_SECONDS)
  if (idx < 0 || idx >= RATES.length) return 'tail'
  return elapsed - idx * STEP_SECONDS < STEP_WARMUP ? 'warmup' : String(idx)
}

export default function (data) {
  runThroughput(data.token, profile, { step: currentStepTag() })
}

// Score every rung, then take the highest one reached by an unbroken run of passes.
export function handleSummary(data) {
  const steps = RATES.map((rate, i) => {
    const failed = data.metrics[`http_req_failed{step:${i}}`]?.values
    const dur = data.metrics[`http_req_duration{step:${i}}`]?.values
    const reqs = data.metrics[`http_reqs{step:${i}}`]?.values

    const demandedRps = rate * REQS_PER_ITER
    const achievedRps = (reqs?.count ?? 0) / MEASURED_SECONDS
    const errorRate = failed?.rate ?? 1
    const delivered = demandedRps > 0 ? achievedRps / demandedRps : 0
    const p95 = dur?.['p(95)'] ?? Infinity

    return {
      rate,
      demandedRps: round(demandedRps),
      achievedRps: round(achievedRps),
      okRps: round(achievedRps * (1 - errorRate)),
      errorPercent: round(errorRate * 100),
      p95Ms: Number.isFinite(p95) ? Math.round(p95) : null,
      avgMs: dur?.avg ? Math.round(dur.avg) : null,
      deliveredPercent: round(delivered * 100),
      pass: errorRate <= MAX_ERROR_RATE && p95 <= MAX_P95_MS && delivered >= MIN_DELIVERY,
    }
  })

  // Stop at the first failure: capacity is monotone, so a later "pass" is noise or an artefact
  // of the backend still draining the backlog from the rung that broke.
  let best = null
  for (const s of steps) {
    if (!s.pass) break
    best = s
  }

  const ceilingFound = best !== null
  const reachedTop = ceilingFound && best.rate === RATES[RATES.length - 1]
  // No rung passed → report the lowest rung's throughput so downstream maths still works, but
  // flag it loudly: this means the backend is unhealthy or STEP_START is already above the knee.
  const winner = best ?? steps[0]

  const result = {
    profile: profile.label,
    successRps: winner.okRps,
    peakIters: round(winner.okRps / REQS_PER_ITER),
    demandedRps: winner.demandedRps,
    shedPercent: winner.errorPercent,
    avgDurationMs: winner.avgMs,
    p95DurationMs: winner.p95Ms,
    ceilingFound,
    reachedTop,
    slo: { maxErrorRate: MAX_ERROR_RATE, maxP95Ms: MAX_P95_MS, minDelivery: MIN_DELIVERY },
    steps,
  }

  const table = steps
    .map((s) => {
      const mark = s.pass ? '✓' : '✗'
      const why = s.pass ? '' : `  ← ${failReason(s)}`
      return (
        `    ${mark} ${pad(s.demandedRps + ' req/s', 12)} ` +
        `served ${pad(s.okRps + '', 7)} err ${pad(s.errorPercent + '%', 7)} ` +
        `p95 ${pad((s.p95Ms ?? '—') + 'ms', 9)} delivered ${s.deliveredPercent}%${why}`
      )
    })
    .join('\n')

  let verdict
  if (!ceilingFound) {
    verdict =
      `    ⚠ NO RUNG MET THE SLO — even ${steps[0].demandedRps} req/s failed.\n` +
      `      The backend is unhealthy, or STEP_START is already past the knee.\n` +
      `      Reported figure is the lowest rung's raw throughput; treat it as a floor, not a ceiling.`
  } else if (reachedTop) {
    verdict =
      `    ⚠ CEILING NOT REACHED — every rung passed, so the real peak is ABOVE ${best.demandedRps} req/s.\n` +
      `      Re-run with more headroom, e.g. STEP_COUNT=${STEP_COUNT + 6} or STEP_SIZE=${STEP_SIZE * 2}.`
  } else {
    verdict = `    ceiling ....: ${winner.okRps} req/s  →  ${result.peakIters} iters/s (highest rung meeting the SLO)`
  }

  return {
    stdout:
      `\n  PROBE RESULT (${profile.label}) — stepped ramp\n` +
      `    SLO ........: err ≤ ${MAX_ERROR_RATE * 100}%, p95 ≤ ${MAX_P95_MS}ms, ≥ ${MIN_DELIVERY * 100}% of demand delivered\n\n` +
      `${table}\n\n${verdict}\n\n`,
    '.probe-result.json': JSON.stringify(result),
  }
}

// Order matters: a saturated backend ALSO under-delivers, because slow responses keep VUs busy
// and starve the arrival-rate pool. So blame the client only when delivery is the *sole* fault —
// otherwise "raise MAX_VUS" sends you tuning the load generator for a backend-side limit.
function failReason(s) {
  const errors = s.errorPercent > MAX_ERROR_RATE * 100
  const slow = s.p95Ms === null || s.p95Ms > MAX_P95_MS
  if (errors && slow) return 'errors + latency'
  if (errors) return 'errors'
  if (slow) return 'latency'
  return 'load generator fell short (raise MAX_VUS)'
}

const round = (n) => Number((Number.isFinite(n) ? n : 0).toFixed(2))
const pad = (s, n) => String(s).padEnd(n)
