# @semantius/load-tests

k6 performance / load tests against the Semantius data APIs (PostgREST on Neon, and the Cube.js
analytics endpoint). Every scenario runs a selectable **load profile** — the request mix per
iteration — so the same `peak` / `maxusers` / `users` flows work against `orders`, `analytics`,
or profiles you add later.

## Why `apps/` and not `packages/`

`packages/*` are importable libraries consumed by other workspace packages. This suite
exports nothing — it is run standalone via `k6 run`, so it lives under `apps/`.

## Prerequisites

- **k6** on PATH — `winget install --id GrafanaLabs.k6 -e` (or see https://k6.io/docs/get-started/installation/).
- **dotenvx** + `DOTENV_PRIVATE_KEY` in the environment, so the encrypted root `.env`
  (holding `SEMANTIUS_API_KEY`, `VITE_CONTROL_PLANE_ORG`) can be decrypted. k6 cannot run
  the Node mint-token script, so it does the `client_credentials` exchange natively in
  `lib/auth.js` against the same `https://<org>.semantius.cloud/token` endpoint, reading
  those secrets from `__ENV` — which is why every run is wrapped in `dotenvx run`.

## Run

Use `load-test.sh` — it locates k6 (even when winget didn't add it to the Git Bash PATH),
injects the encrypted root `.env` via dotenvx, and runs the scenario. From this directory:

```bash
# users:
./load-test.sh maxusers     # (a) just FIND the max number of concurrent users, print it, exit
./load-test.sh maxusers 5   # (b) find the max, then RUN that many users for 5 minutes
./load-test.sh users 30 5   # (c) run an EXPLICIT 30 users for 5 minutes

# throughput (req/s):
./load-test.sh peak         # AUTO: discover peak req/s, then sustain it 1 minute (default)
./load-test.sh peak 5       # AUTO: discover peak req/s, then sustain it 5 minutes

# building blocks:
./load-test.sh smoke        # 1 VU, 5 iterations — validates token + endpoint wiring
./load-test.sh probe        # just the stepped-ramp ceiling discovery (prints the number)
RATE=8 ./load-test.sh sustain 5   # sustain a fixed rate, for 5 minutes

# choose a load profile (word after the scenario, before the numbers; default 'orders'):
./load-test.sh maxusers analytics       # find max users for the analytics profile
./load-test.sh users analytics 30 5     # 30 users, analytics profile, 5 minutes
./load-test.sh peak analytics 5         # peak req/s for the analytics profile

# pass extra k6 flags through (after scenario/profile/numbers):
./load-test.sh peak 5 --out json=results.json
```

**`peak` needs no rate set by hand** — it finds the sustainable rate and holds it for you.

The `pnpm` scripts are thin wrappers over the same thing (work from anywhere in the repo):

```bash
pnpm --filter @semantius/load-tests smoke
pnpm --filter @semantius/load-tests peak
```

> Requires `DOTENV_PRIVATE_KEY` in the environment (to decrypt `.env`). If k6 is missing,
> `load-test.sh` tells you the install command.

## What `peak` does (fully automated — no manual rate)

Two chained k6 runs, orchestrated by `load-test.sh` (k6's arrival-rate stages are static, so a
single run can't feed a *discovered* rate into a hold — hence two runs):

1. **Probe** (`scenarios/probe.js`) — a **stepped ramp**: raise the arrival rate one flat rung at
   a time (default 8 rungs, 3→24 iters/s, 20s each) and score each rung on its own. A rung passes
   if error rate ≤ `MAX_ERROR_RATE`, p95 ≤ `MAX_P95_MS`, and ≥ `MIN_DELIVERY` of the demanded rate
   was actually applied. The ceiling is the highest rung reached by an unbroken run of passes;
   `handleSummary` writes it to `.probe-result.json` along with the full per-rung table.

   > **Why stepped, not a single overload flood?** The original probe flooded once at a fixed
   > overload rate and took the successful req/s as the ceiling. That only works if the backend
   > sheds excess load *instantly and cheaply* — as it did when the endpoint had a hard connection
   > cap answering `400 Too many connections` in microseconds. A backend that scales by
   > **queueing** instead breaks the assumption: past its knee, latency grows without bound,
   > requests time out instead of failing fast, the VU pool drains, and measured throughput
   > **collapses toward zero**. Throughput-under-overload is non-monotonic, so one sample taken
   > past the cliff reports a near-zero ceiling for a backend that just got *faster*. Symptom to
   > recognise: `status=0` timeout warnings, ~100% shed, and a `maxusers` answer of 1.
2. **Sustain** (`scenarios/sustain.js`) — the script reads that rate and holds it for **`MINUTES`**
   minutes (default 1; the bare number passed to `load-test.sh`), characterising steady state.

Each **iteration** runs the selected profile's actions in sequence, each tagged so the summary
breaks latency/errors down per action. The rate is in **iterations/second**; with N actions per
iteration, total req/s ≈ N × the rate (so `peak`/`probe` divide by N to report iters/s).

## Load profiles

A **profile** is the request mix run per iteration, defined in `lib/profiles.js`. Select one with
the word after the scenario (default `orders`) or the `PROFILE` env var. Every scenario
(`probe`/`sustain`/`users`) runs the selected profile, so the flows are profile-agnostic.

| Profile | Actions per iteration | Endpoint |
| --- | --- | --- |
| `orders` (default) | `orders-list` (random page 1–80), `order` (id 10250–11000), `product` (id 1–75) | PostgREST / Neon `GET` |
| `analytics` | `analytics` — one Cube.js query batch (`POST`, total freight by product category) | `https://<org>.semantius.io/nwind/cubejs-api/v1/batch` |

Both use the same bearer token. The `maxusers` math is profile-agnostic: in a user session each
action is followed by one think, so a user issues one request per `(think + active)` regardless
of action count — `saturation users ≈ ceiling_req/s × (avg_think + active)`, where `active` is the mean request latency measured at the winning rung (override with `ACTIVE_PER_REQ`).

**Adding a profile:** add an entry to `PROFILES` in `lib/profiles.js` — a `label` and an
`actions` array of `{ name, build }`, where `build()` returns a `{ method, url, body? }`
descriptor. Reuse the request builders in `lib/orders.js` / `lib/products.js` / `lib/analytics.js`
or add new ones. Combined profiles (e.g. mixing orders + analytics actions) are just a longer
`actions` array.

Tunables (env vars): `MINUTES`, `MAX_VUS`, `REQ_TIMEOUT` (per-request timeout, default `15s` —
k6's own 60s default lets a queueing backend block VUs for a full minute), and
`LOADTEST_API_HOST` (point at a different instance). `RATE` overrides the sustain rate if you
run `sustain` directly instead of via `peak`.

Probe ramp shape: `STEP_START`, `STEP_SIZE`, `STEP_COUNT`, `STEP_SECONDS`, `STEP_WARMUP` (leading
seconds of each rung discarded so rungs are judged on steady state, not the transient after the
rate jumps). Probe SLO: `MAX_ERROR_RATE` (0.01), `MAX_P95_MS` (2000), `MIN_DELIVERY` (0.9).

The probe warns when it failed to **bracket** the ceiling, and both `peak` and `maxusers` repeat
that warning since both build on the number: if every rung passes, the real peak is above what was
probed (raise `STEP_COUNT`/`STEP_SIZE`); if no rung passes, the number is a floor, not a ceiling
(the backend is unhealthy, or `STEP_START` is already past the knee). Don't trust a reported
ceiling — or a sustain/users run derived from one — that came with either warning.

## Modelling real users

`probe`/`sustain` measure raw **throughput** (no pauses). The `users` model instead simulates
**concurrent people**: **1 VU = 1 user**, each running a browse session — open orders grid →
*think* → open an order → *think* → open a product → *think* — and looping.

Think time is a random **8–12s per action** (avg 10s), configurable via `THINK_MIN`/`THINK_MAX`
(e.g. `THINK_MIN=3 THINK_MAX=6` for a "power user" stress case). Because each user is mostly
idle (reading), N concurrent users generate only a small req/s — which is exactly the point: it
tells you how many real users a given backend throughput corresponds to.

### Arrivals are shaped, and the ramp is not measured

Users **ramp in over `RAMP_SECONDS`** (default 30) and each VU's first request carries a random
phase offset. Both matter, for different reasons:

- **Ramp** — a serverless backend scales on demand. Dropping the full user count on a cold one
  produces a wall of `57014 statement timeout` in the first seconds *even when the steady-state
  load is well inside its ceiling*. The probe never hits this because a stepped ramp warms the
  backend on the way up; a `users` run without a ramp does.
- **Jitter** — `constant-vus` starts every VU at once and each fires immediately, so N users
  produce an N-deep burst at t=0 (300 users → 300 concurrent requests against a ~36 req/s
  backend) and stay phase-aligned for several cycles after. A uniform offset over one user cycle
  smooths the aggregate arrival process, which is what real users look like.

Because the ramp is warmup, requests are tagged `phase:ramp` / `phase:steady` and the summary
reports them **separately**, with the verdict taken from steady state only:

```
    ramp        443 reqs    14.77 req/s  err 0%   avg 267ms  p95 893ms   ← warmup, excluded
    steady     3790 reqs    31.58 req/s  err 0%   avg 236ms  p95 815ms   ← the measurement

    ✓ 300 users SUSTAINED — steady state met err ≤ 1%, p95 ≤ 2000ms.
```

A single blended number would report this clean run as a 4%-error failure. If a run errors, check
*which phase* before concluding the user count is too high — a dirty ramp with a clean steady
state means the backend needed longer to warm up (raise `RAMP_SECONDS`), not that the count is
wrong. Steady-state SLO: `MAX_ERROR_RATE` (0.01), `MAX_P95_MS` (2000).

There are three ways to drive it:

### (a) Just find the max number of users — `maxusers`

Probes the backend and prints the number, without running a load — plus the two commands to
actually run it:

```bash
./load-test.sh maxusers
# >>> Ceiling 6.81 req/s + 8-12s think → saturates ~72 users, max 64 (0.9 headroom)
# >>> MAX USERS = 64
# >>> Run them:  ./load-test.sh users 64 <minutes>   # this exact count (no re-probe)
# >>>      or :  ./load-test.sh maxusers <minutes>   # re-probes; may differ (ceiling fluctuates)
```

The two run commands are **not** identical: `users 64 <n>` pins exactly the number you just
measured, while `maxusers <n>` runs a **fresh probe** first — and because the serverless ceiling
fluctuates run-to-run, that re-probe can land on a different count. Use `users <m> <n>` to lock
in a measured value; use `maxusers <n>` to re-measure against current conditions.

How it's derived: probe the throughput ceiling, then convert via the session model — each user
issues ~one request per `(think + a little active time)`, so
`saturation users ≈ ceiling_req/s × (avg_think + active)`, where `active` is the mean request latency measured at the winning rung (override with `ACTIVE_PER_REQ`). It reports **90% of saturation** by
default (`HEADROOM=0.9`) so the number is one you can actually run cleanly; `HEADROOM=1` gives
the raw edge (expect errors and elevated latency there).

Note the headroom is smaller than the ceiling's own run-to-run variance (measured 27–36 req/s on
the same endpoint within an hour), so a count derived from a high-side probe can exceed a
low-side ceiling on the next run. If a `maxusers` count fails its steady-state check, re-probe
before assuming something regressed.

### (b) Find the max, then run it — `maxusers <minutes>`

Same discovery, then sustains that many users for N minutes and reports real error/latency:

```bash
./load-test.sh maxusers 5                          # find max, run for 5 minutes
HEADROOM=1 ./load-test.sh maxusers 5               # run at the exact saturation point
THINK_MIN=3 THINK_MAX=6 ./load-test.sh maxusers 5  # power-user think time → fewer max users
```

### (c) Run an explicit number of users — `users <m> <minutes>`

Skip discovery and drive exactly `m` users for `n` minutes (n defaults to 1):

```bash
./load-test.sh users 30 5                          # 30 users, 10s avg think, 5 min
THINK_MIN=3 THINK_MAX=6 ./load-test.sh users 30 5  # 30 impatient power users
```

> A users run may take longer than `<minutes>` to exit: k6 lets in-flight sessions finish their
> current think/request after the clock runs out (graceful stop), so a 1-minute run with ~31s
> sessions can wall-clock somewhat longer.

> The backend is serverless and its ceiling **fluctuates run-to-run** (warmup/contention), so
> the discovered user count varies between runs — treat it as a ballpark, not a fixed spec.

## Layout

```
lib/auth.js       token exchange (k6-native port of scripts/mint-token.mjs)
lib/http.js       shared request helper apiRequest() (bearer auth, GET/POST, per-{status,name}
                    counter, non-200 log) + think() + randomInt()
lib/profiles.js   PROFILES registry + runThroughput/runSession/taggedThresholds — the abstraction
lib/orders.js     orders request builders: random-page list + single order by random id
lib/products.js   products request builder: single product by random id
lib/analytics.js  analytics request builder: Cube.js query batch (POST)
scenarios/smoke.js    wiring validation (runs the selected profile once)
scenarios/probe.js    stepped ramp to discover the throughput ceiling (writes .probe-result.json)
scenarios/sustain.js  hold a fixed request rate for MINUTES minutes
scenarios/users.js    constant-vus real-user model (1 VU = 1 user, with think time)
load-test.sh          CLI + orchestration (peak, maxusers); parses scenario/profile/numbers
```

> `peak` and `maxusers` are not scenario files — they're `load-test.sh` orchestrations that run
> `probe` first, then `sustain` (peak) or `users` (maxusers) with the discovered value. `probe`,
> `sustain` and `users` can also be run on their own.

## Extending

- **New request mix** → add a profile to `PROFILES` in `lib/profiles.js` (see *Load profiles*).
- **New executor/shape** → add a scenario under `scenarios/` that calls `activeProfile()` +
  `runThroughput`/`runSession` and `taggedThresholds(profile)`, so it works for every profile.
- **Multiple test users** → `mintToken()` currently returns one token in `setup()`; return an
  array of tokens and pick one per-VU (e.g. by `__VU`) to load-test as distinct principals.
