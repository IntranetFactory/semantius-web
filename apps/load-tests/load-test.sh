#!/usr/bin/env bash
#
# Run the k6 load tests with secrets injected from the repo-root .env.
#
#   ./load-test.sh maxusers      # (a) just FIND the max number of users and print it
#   ./load-test.sh maxusers 5    # (b) find the max, then RUN that many users for 5 minutes
#   ./load-test.sh users 30 5    # (c) run an EXPLICIT 30 users for 5 minutes
#
#   ./load-test.sh peak          # AUTO: probe for the peak req/s, then sustain it for 1 minute
#   ./load-test.sh peak 5        # AUTO: probe for the peak req/s, then sustain it for 5 minutes
#   ./load-test.sh smoke         # wiring check (1 VU)
#   ./load-test.sh probe         # just the throughput-discovery flood (prints the number)
#   RATE=8 ./load-test.sh sustain 5   # just sustain, at an explicit rate, for 5 minutes
#
# `peak` is the headline command: it needs NO manual rate — phase 1 discovers the endpoint's
# sustainable throughput, phase 2 holds at exactly that for N minutes.
#
# Tunables (env vars): MINUTES, PROBE_RATE, PROBE_DURATION, MAX_VUS, LOADTEST_API_HOST.
# Trailing args after the (scenario [minutes]) pass straight through to `k6 run`.
#
# Works on Windows Git Bash and the Linux sandbox alike.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Locate k6. On Windows, winget installs it to "C:\Program Files\k6" but does not always
# add it to the Git Bash PATH, so fall back to known install locations.
if ! command -v k6 >/dev/null 2>&1; then
  for candidate in "/c/Program Files/k6" "/c/Program Files (x86)/k6"; do
    if [ -x "$candidate/k6.exe" ]; then
      export PATH="$PATH:$candidate"
      break
    fi
  done
fi
if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 not found on PATH." >&2
  echo "Install it with:  winget install --id GrafanaLabs.k6 -e" >&2
  echo "(or see https://k6.io/docs/get-started/installation/)" >&2
  exit 1
fi

SCENARIO="${1:-peak}"
shift || true

# Collect the leading bare-integer positional args; their meaning depends on the scenario:
#   most scenarios:  <minutes>
#   users:           <users> <minutes>
#   maxusers:        [minutes]   (omit = just find & print the number; give it = also run)
# Anything after the numbers passes straight through to `k6 run`.
NUMS=()
while [[ "${1:-}" =~ ^[0-9]+$ ]]; do
  NUMS+=("$1")
  shift
done
N1="${NUMS[0]:-}"
N2="${NUMS[1]:-}"

# Run k6 with secrets injected. dotenvx decrypts the encrypted repo-root .env (needs
# DOTENV_PRIVATE_KEY in the environment) and injects SEMANTIUS_API_KEY / VITE_CONTROL_PLANE_ORG
# for the token exchange. Exit 99 = "thresholds crossed" — the run still completed, so treat
# it as success for orchestration.
run_k6() {
  local rc=0
  dotenvx run -f ../../.env -- k6 run "$@" || rc=$?
  if [ "$rc" -ne 0 ] && [ "$rc" -ne 99 ]; then
    echo "k6 run failed (exit $rc)" >&2
    exit "$rc"
  fi
}

# Timestamped wrapper: prints wall-clock start/end and elapsed seconds around a k6 run.
run_phase() {
  local label="$1"
  shift
  local start_epoch
  start_epoch=$(date +%s)
  echo ">>> ${label} started:  $(date '+%Y-%m-%d %H:%M:%S')"
  run_k6 "$@"
  echo ">>> ${label} finished: $(date '+%Y-%m-%d %H:%M:%S')  (elapsed $(($(date +%s) - start_epoch))s)"
}

# `peak` is orchestrated (two chained runs), not a single scenario file.
if [ "$SCENARIO" = "peak" ]; then
  MINUTES="${N1:-1}"
  echo ">>> Phase 1/2 — probing for peak throughput..."
  rm -f .probe-result.json
  run_phase "PROBE" scenarios/probe.js
  if [ ! -f .probe-result.json ]; then
    echo "Probe produced no result (.probe-result.json missing) — aborting." >&2
    exit 1
  fi
  PEAK_ITERS=$(node -e "const r=require('./.probe-result.json'); process.stdout.write(String(Math.max(1, Math.round(r.peakIters))))")
  SUCC_RPS=$(node -e "process.stdout.write(String(require('./.probe-result.json').successRps))")
  echo ">>> Discovered peak ≈ ${SUCC_RPS} req/s → sustaining at ${PEAK_ITERS} iters/s for ${MINUTES} min"
  echo ">>> Phase 2/2 — sustaining at the discovered peak..."
  export RATE="$PEAK_ITERS"
  export MINUTES
  run_phase "SUSTAIN" scenarios/sustain.js "$@"
  exit 0
fi

# `maxusers` = user-space equivalent of `peak`. It probes the backend's throughput ceiling,
# then converts it to a user count via the session model: a user in this scenario issues one
# request per (think + a little active time), so
#   max users ≈ ceiling_req/s × (avg_think_seconds + active_per_request_seconds).
# Two modes, chosen by whether a minutes arg is given:
#   (a) `maxusers`      → just find & print the number, then exit.
#   (b) `maxusers <n>`  → find, then run that many users (with think time) for n minutes and
#                          report the real error/latency, so you see whether it holds.
if [ "$SCENARIO" = "maxusers" ]; then
  export THINK_MIN="${THINK_MIN:-8}"
  export THINK_MAX="${THINK_MAX:-12}"
  echo ">>> Probing backend throughput ceiling..."
  rm -f .probe-result.json
  run_phase "PROBE" scenarios/probe.js
  if [ ! -f .probe-result.json ]; then
    echo "Probe produced no result (.probe-result.json missing) — aborting." >&2
    exit 1
  fi
  # HEADROOM (0..1) keeps the sustained user count just under the saturation point so the run
  # is clean; the raw saturation estimate is reported too. Set HEADROOM=1 for the hard edge.
  export HEADROOM="${HEADROOM:-0.9}"
  # `|| true`: read returns non-zero at EOF; the node line ends with \n but guard anyway so
  # `set -e` never aborts here.
  read -r SATURATION_USERS MAX_USERS < <(node -e "
    const r = require('./.probe-result.json');
    const avgThink = (Number(process.env.THINK_MIN) + Number(process.env.THINK_MAX)) / 2;
    const activePerReq = Number(process.env.ACTIVE_PER_REQ || 0.5); // per-request active seconds
    const perUserRps = 1 / (avgThink + activePerReq);              // 1 request per (think+active)
    const saturation = r.successRps / perUserRps;                  // avg demand == ceiling
    const target = Math.max(1, Math.floor(saturation * Number(process.env.HEADROOM)));
    process.stdout.write(Math.max(1, Math.round(saturation)) + ' ' + target + '\n');
  ") || true
  SUCC_RPS=$(node -e "process.stdout.write(String(require('./.probe-result.json').successRps))")
  echo ">>> Ceiling ${SUCC_RPS} req/s + ${THINK_MIN}-${THINK_MAX}s think → saturates ~${SATURATION_USERS} users, max ${MAX_USERS} (${HEADROOM} headroom)"

  # (a) find-only: no minutes arg → print and stop.
  if [ -z "$N1" ]; then
    echo ">>> MAX USERS = ${MAX_USERS}"
    echo ">>> Run them:  ./load-test.sh users ${MAX_USERS} <minutes>   # this exact count (no re-probe)"
    echo ">>>      or :  ./load-test.sh maxusers <minutes>            # re-probes; may differ (ceiling fluctuates)"
    exit 0
  fi

  # (b) find & run for N1 minutes.
  echo ">>> Running ${MAX_USERS} users for ${N1} min..."
  export USERS="$MAX_USERS"
  export MINUTES="$N1"
  run_phase "USERS" scenarios/users.js "$@"
  exit 0
fi

# `users` = run an EXPLICIT number of users for N minutes: `users <m> <n>` (n defaults to 1).
# The USERS env var is a fallback when <m> is omitted.
if [ "$SCENARIO" = "users" ]; then
  [ -n "$N1" ] && export USERS="$N1"
  export MINUTES="${N2:-1}"
  run_phase "users" scenarios/users.js "$@"
  exit 0
fi

# Any other name maps to a scenario file run directly; a leading number = minutes.
SCENARIO_FILE="scenarios/${SCENARIO}.js"
if [ ! -f "$SCENARIO_FILE" ]; then
  echo "Unknown scenario '$SCENARIO'. Try: peak | maxusers | users | smoke | probe | sustain" >&2
  exit 1
fi
[ -n "$N1" ] && export MINUTES="$N1"
run_phase "$SCENARIO" "$SCENARIO_FILE" "$@"
