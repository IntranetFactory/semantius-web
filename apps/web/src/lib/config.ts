/**
 * Runtime application configuration.
 *
 * initConfig() is async and must be awaited before the app renders.
 * When VITE_CONTROL_PLANE_URL is set, tenant config is fetched from the
 * control plane and merged on top of VITE_* fallback values.
 */

export interface AppConfig {
  // OAuth
  oauthClientId: string
  oauthAuthEndpoint: string
  oauthTokenEndpoint: string
  oauthScope: string
  oauthUserinfoEndpoint?: string
  oauthLogoutEndpoint?: string
  oauthLogoutRedirect?: string
  oauthAudience?: string

  // API
  apiBaseUrl: string
  apiType?: string
  supabaseApiKey?: string

  // Tenant (populated when control plane is used)
  tenantId?: string
  tenantName?: string
  tenantLogo?: string | null
}

let _config: AppConfig | null = null
let _configError: string | null = null

/** If initConfig() failed, this holds the error message. */
export function getConfigError(): string | null {
  return _configError
}

function envFallback(): AppConfig {
  return {
    oauthClientId: import.meta.env.VITE_OAUTH_CLIENT_ID ?? '',
    oauthAuthEndpoint: import.meta.env.VITE_OAUTH_AUTH_ENDPOINT ?? '',
    oauthTokenEndpoint: import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT ?? '',
    oauthScope: import.meta.env.VITE_OAUTH_SCOPE || 'openid profile email',
    oauthUserinfoEndpoint: import.meta.env.VITE_OAUTH_USERINFO_ENDPOINT || undefined,
    oauthLogoutEndpoint: import.meta.env.VITE_OAUTH_LOGOUT_ENDPOINT || undefined,
    oauthLogoutRedirect: import.meta.env.VITE_OAUTH_LOGOUT_REDIRECT || undefined,
    oauthAudience: import.meta.env.VITE_OAUTH_AUDIENCE || undefined,

    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    apiType: normaliseApiType(import.meta.env.VITE_API_TYPE),
    supabaseApiKey: import.meta.env.VITE_SUPABASE_APIKEY || undefined,
  }
}

/**
 * Extract tenant name from the current URL.
 * It is the leftmost subdomain of the hostname.
 * e.g. http://test.adenin.com/foo → "test"
 *      http://localhost:1234/bar  → "localhost"
 */
function getTenantName(): string {
  const parts = window.location.hostname.split('.')
  return parts[0]
}

interface TenantResponse {
  id: string
  name: string
  logo: string | null
  postgrest_url: string
}

/**
 * Load configuration. Must be awaited before the app renders.
 * When VITE_CONTROL_PLANE_URL is set, fetches tenant config and merges it.
 * On failure, records the error (retrievable via getConfigError()).
 */
export async function initConfig(): Promise<AppConfig> {
  _configError = null
  const fallback = envFallback()

  const controlPlaneUrl = (import.meta.env.VITE_CONTROL_PLANE_URL ?? '').trim()

  if (controlPlaneUrl) {
    const tenantName = getTenantName()
    const url = `${controlPlaneUrl.replace(/\/+$/, '')}/api/tenant/${encodeURIComponent(tenantName)}`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        _configError = `Tenant lookup failed: ${res.status} ${res.statusText} (${url})`
        _config = fallback
        return _config
      }

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        _configError = `Tenant lookup returned unexpected content-type: ${contentType} (${url})`
        _config = fallback
        return _config
      }

      const tenant: TenantResponse = await res.json()

      _config = {
        ...fallback,
        apiBaseUrl: tenant.postgrest_url || fallback.apiBaseUrl,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantLogo: tenant.logo,
      }
      return _config
    } catch (err) {
      _configError = `Tenant lookup failed: ${err instanceof Error ? err.message : String(err)} (${url})`
      _config = fallback
      return _config
    }
  }

  _config = fallback
  return _config
}

/** Get the current config. Throws if initConfig() has not been awaited. */
export function getConfig(): AppConfig {
  if (!_config) {
    throw new Error('App config not initialised — await initConfig() before rendering')
  }
  return _config
}

function normaliseApiType(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.toLowerCase()
  }
  return undefined
}
