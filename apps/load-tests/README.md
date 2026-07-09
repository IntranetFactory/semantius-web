# @semantius/load-tests

k6 performance / load tests against the Semantius PostgREST (Neon) data API.

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
./load-test.sh probe        # just the throughput-discovery flood (prints the number)
RATE=8 ./load-test.sh sustain 5   # sustain a fixed rate, for 5 minutes

# pass extra k6 flags through (after scenario [minutes]):
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

1. **Probe** (`scenarios/probe.js`) — flood the API at a deliberately-overloaded constant rate
   for ~30s. Since the endpoint is connection-capped, it serves up to its ceiling and sheds the
   rest (`400 Too many connections`), so the **successful** request rate over the window *is*
   the sustainable peak. `handleSummary` writes it to `.probe-result.json`.
2. **Sustain** (`scenarios/sustain.js`) — the script reads that rate and holds it for **`MINUTES`**
   minutes (default 1; the bare number passed to `load-test.sh`), characterising steady state.

Each **iteration** fires the three request types in sequence — within a VU the pattern is
`1,2,3,1,2,3,…` — and each is tagged so the summary breaks latency/errors down per type:

1. `orders-list` — a random **page 1–80** of `orders` (`limit=10`, `offset=(page-1)*10`, `order=id.desc`)
2. `order` — a single order by random id in **10250–11000** (`orders?id=eq.<n>`)
3. `product` — a single product by random id in **1–75** (`products?id=eq.<n>`)

The rate is in **iterations/second**; with 3 requests per iteration, total req/s ≈ 3× the rate.

Tunables (env vars): `MINUTES`, `PROBE_RATE`, `PROBE_DURATION`, `MAX_VUS`, and
`LOADTEST_API_HOST` (point at a different instance). `RATE` overrides the sustain rate if you
run `sustain` directly instead of via `peak`.

## Modelling real users

`probe`/`sustain` measure raw **throughput** (no pauses). The `users` model instead simulates
**concurrent people**: `constant-vus` with **1 VU = 1 user**, each running a browse session —
open orders grid → *think* → open an order → *think* → open a product → *think* — and looping.

Think time is a random **8–12s per action** (avg 10s), configurable via `THINK_MIN`/`THINK_MAX`
(e.g. `THINK_MIN=3 THINK_MAX=6` for a "power user" stress case). Because each user is mostly
idle (reading), N concurrent users generate only a small req/s — which is exactly the point: it
tells you how many real users a given backend throughput corresponds to.

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
`saturation users ≈ ceiling_req/s × (avg_think + ~0.5s)`. It reports **90% of saturation** by
default (`HEADROOM=0.9`) so the number is one you can actually run cleanly; `HEADROOM=1` gives
the raw edge (expect `400 Too many connections` shedding there).

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
lib/http.js       shared GET helper (bearer auth, per-{status,name} counter, non-200 log) + think()
lib/orders.js     orders URL builders: random-page list + single order by random id
lib/products.js   products URL builder: single product by random id
scenarios/smoke.js    wiring validation (all three request types)
scenarios/probe.js    flood to discover the throughput ceiling (writes .probe-result.json)
scenarios/sustain.js  hold a fixed request rate for MINUTES minutes
scenarios/users.js    constant-vus real-user model (1 VU = 1 user, with think time)
load-test.sh          CLI + orchestration (peak, maxusers)
```

> `peak` and `maxusers` are not scenario files — they're `load-test.sh` orchestrations that run
> `probe` first, then `sustain` (peak) or `users` (maxusers) with the discovered value. `probe`,
> `sustain` and `users` can also be run on their own.

## Adding users / scenarios

`mintToken()` currently returns one token in `setup()`. To load-test as multiple users,
return an array of tokens and pick one per-VU (e.g. by `__VU`). New scenarios go under
`scenarios/` and reuse `lib/`.
