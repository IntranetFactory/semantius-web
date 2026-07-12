/**
 * Runtime environment override — lets the SAME compiled bundle be reconfigured
 * per deployment without a rebuild ("build once, run anywhere").
 *
 * Vite inlines `import.meta.env.VITE_*` at BUILD time, which normally binds a
 * build to one environment. To break that binding for the Docker image, a small
 * `/config.js` (loaded before the app bundle in index.html) assigns real values
 * to `window.__ENV__`, and every config read goes through `runtimeEnv()` below.
 *
 * The placeholder guard keeps the NON-Docker paths byte-for-byte unchanged:
 *   - `apps/web/public/config.js` ships all-placeholder tokens (`__VITE_X__`).
 *   - In local dev and on Vercel/Cloudflare, nothing replaces those tokens, so
 *     `runtimeEnv()` treats them as absent and returns the build-time value that
 *     Vite baked from `.env` / `.env.local` — exactly today's behavior.
 *   - Only the Docker entrypoint (docker/gen-config.sh) rewrites config.js with
 *     real values, at which point `runtimeEnv()` returns those instead.
 *
 * `docker/.env` is a Docker-only file consumed by that script; it is NOT a Vite
 * env file and has nothing to do with `.env` / `.env.local`.
 */

declare global {
  interface Window {
    __ENV__?: Record<string, string>
  }
}

/** True for an unreplaced placeholder token like `__VITE_API_BASE_URL__`. */
function isPlaceholder(v: string): boolean {
  return v.startsWith('__') && v.endsWith('__')
}

/**
 * Return the runtime value for `key` from `window.__ENV__` when it holds a real
 * (non-placeholder, non-empty) value; otherwise fall back to `buildTime` (the
 * value Vite inlined from `import.meta.env.<key>` at build time).
 */
export function runtimeEnv(key: string, buildTime: string | undefined): string | undefined {
  const v = typeof window !== 'undefined' ? window.__ENV__?.[key] : undefined
  if (typeof v === 'string' && v !== '' && !isPlaceholder(v)) return v
  return buildTime
}
