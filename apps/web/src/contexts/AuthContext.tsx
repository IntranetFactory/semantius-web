import { type ReactNode, useEffect, useLayoutEffect, useContext, useState, useRef, createContext, useMemo } from 'react'
import { AuthProvider, AuthContext as OAuthContext } from 'react-oauth2-code-pkce'
import type { IAuthContext } from 'react-oauth2-code-pkce'
import { ConfigErrorPage } from '@/components/ConfigErrorPage'
import { getApiConfig, createApiHeaders, setInterceptorToken } from '@/lib/apiClient'
import { getConfig } from '@/lib/config'
import type { AnyRouter } from '@tanstack/react-router'
import type { RouterContext } from '@/routes/__root'

// User info types
export interface UserInfo {
  sub?: string
  name?: string
  email?: string
  picture?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  [key: string]: unknown
}

export interface Module {
  id: number
  alias: string
  logo_url: string | null
  home_page: string
  created_at: string
  logo_color: string | null
  updated_at: string
  description: string
  module_name: string
  view_permission: string
  edit_permission: string
}

export interface RpcUserInfo {
  modules?: Module[]
  [key: string]: unknown
}

// Combined auth context type
export interface AuthContextType extends IAuthContext {
  userInfo: UserInfo | null
  userInfoLoading: boolean
  userInfoError: Error | null
  rpcUserInfo: RpcUserInfo | null
  rpcUserInfoLoading: boolean
  rpcUserInfoError: Error | null
  isAuthReady: boolean
}

// Create the unified auth context
export const AuthContext = createContext<AuthContextType | null>(null)

// Placeholder values that indicate missing configuration
const PLACEHOLDER_PATTERNS = [
  'your-client-id',
  'your-auth-server.com',
  'your-postgrest-api.com',
]

// Check if a value contains any placeholder pattern
function containsPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some(pattern => value.includes(pattern))
}

// Validate OAuth configuration — reads from runtime config
function validateConfig() {
  const missingVars: string[] = []
  const cfg = getConfig()
  const { baseUrl: apiBaseUrl, type: apiType, supabaseApiKey } = getApiConfig()

  if (!cfg.oauthClientId || containsPlaceholder(cfg.oauthClientId)) {
    missingVars.push('VITE_OAUTH_CLIENT_ID')
  }

  if (!cfg.oauthAuthEndpoint || containsPlaceholder(cfg.oauthAuthEndpoint)) {
    missingVars.push('VITE_OAUTH_AUTH_ENDPOINT')
  }

  if (!cfg.oauthTokenEndpoint || containsPlaceholder(cfg.oauthTokenEndpoint)) {
    missingVars.push('VITE_OAUTH_TOKEN_ENDPOINT')
  }

  if (!apiBaseUrl || containsPlaceholder(apiBaseUrl)) {
    missingVars.push('VITE_API_BASE_URL')
  }

  if (apiType === 'supabase') {
    if (!supabaseApiKey || supabaseApiKey.trim() === '') {
      missingVars.push('VITE_SUPABASE_APIKEY (required when VITE_API_TYPE=supabase)')
    }
  }

  return missingVars
}

// Inner component that updates router context and fetches user info when auth changes
function RouterContextUpdater({
  router,
  children
}: {
  router: AnyRouter
  children: ReactNode
}) {
  const oauthContext = useContext(OAuthContext)
  const { token, tokenData } = oauthContext

  // User info state
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [userInfoLoading, setUserInfoLoading] = useState(false)
  const [userInfoError, setUserInfoError] = useState<Error | null>(null)
  const [rpcUserInfo, setRpcUserInfo] = useState<RpcUserInfo | null>(null)
  const [rpcUserInfoLoading, setRpcUserInfoLoading] = useState(false)
  const [rpcUserInfoError, setRpcUserInfoError] = useState<Error | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const fetchedTokenRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    setInterceptorToken(token || null)

    const isAuthenticated = !!token && !!tokenData && tokenData.exp * 1000 > Date.now()

    router.update({
      context: {
        auth: {
          isAuthenticated: () => isAuthenticated,
          getToken: () => token || null,
        },
      } satisfies RouterContext,
    })

    router.invalidate()
  }, [token, tokenData, router])

  useEffect(() => {
    const fetchUserInfoData = async () => {
      const cfg = getConfig()
      const userinfoEndpoint = cfg.oauthUserinfoEndpoint
      const { baseUrl: apiBaseUrl } = getApiConfig()

      if (!token) {
        setUserInfo(null)
        setRpcUserInfo(null)
        setUserInfoLoading(false)
        setRpcUserInfoLoading(false)
        setIsAuthReady(false)
        fetchedTokenRef.current = null
        return
      }

      if (fetchedTokenRef.current === token) {
        return
      }

      fetchedTokenRef.current = token
      setUserInfoError(null)
      setRpcUserInfoError(null)
      setIsAuthReady(false)

      const shouldFetchOAuthUserInfo = !!userinfoEndpoint
      const shouldFetchRpcUserInfo = !!apiBaseUrl

      setUserInfoLoading(shouldFetchOAuthUserInfo)
      setRpcUserInfoLoading(shouldFetchRpcUserInfo)

      const promises: Promise<boolean>[] = []

      if (shouldFetchOAuthUserInfo) {
        promises.push(
          fetch(userinfoEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.statusText}`)
              }
              const data = await response.json()
              setUserInfo(data)
              return true
            })
            .catch((error) => {
              console.error('Error fetching OAuth user info:', error)
              setUserInfoError(error instanceof Error ? error : new Error('Unknown error'))
              setUserInfo(null)
              return false
            })
            .finally(() => {
              setUserInfoLoading(false)
            })
        )
      }

      if (shouldFetchRpcUserInfo) {
        const headersRecord = createApiHeaders(token)

        promises.push(
          fetch(`${apiBaseUrl}/rpc/get_userinfo`, {
            method: 'POST',
            headers: headersRecord,
            body: "{}",
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch RPC user info: ${response.statusText}`)
              }
              const data = await response.json()
              setRpcUserInfo(data)
              return true
            })
            .catch((error) => {
              console.error('Error fetching RPC user info:', error)
              setRpcUserInfoError(error instanceof Error ? error : new Error('Unknown error'))
              setRpcUserInfo(null)
              return false
            })
            .finally(() => {
              setRpcUserInfoLoading(false)
            })
        )
      }

      if (promises.length > 0) {
        await Promise.all(promises)
      }

      setIsAuthReady(true)
    }

    fetchUserInfoData()
  }, [token])

  const combinedContext: AuthContextType = {
    ...oauthContext,
    userInfo,
    userInfoLoading,
    userInfoError,
    rpcUserInfo,
    rpcUserInfoLoading,
    rpcUserInfoError,
    isAuthReady,
  }

  return (
    <AuthContext.Provider value={combinedContext}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProviderWrapper({
  router,
  children
}: {
  router: AnyRouter
  children: ReactNode
}) {
  // Validate and build authConfig inside the component — config is guaranteed
  // to be loaded because main.tsx awaits initConfig() before rendering.
  const missingVars = useMemo(() => validateConfig(), [])

  const authConfig = useMemo(() => {
    if (missingVars.length > 0) return null
    const cfg = getConfig()
    return {
      clientId: cfg.oauthClientId,
      authorizationEndpoint: cfg.oauthAuthEndpoint,
      tokenEndpoint: cfg.oauthTokenEndpoint,
      redirectUri: `${window.location.origin}/oauth2_callback`,
      scope: cfg.oauthScope,
      logoutEndpoint: cfg.oauthLogoutEndpoint,
      autoLogin: false,
      postLogin: () => {
        const prefix = `SC_${import.meta.env.MODE}_`
        const t = sessionStorage.getItem(`${prefix}token`) || localStorage.getItem(`${prefix}token`)
        //console.log('[AUTH] token received:', t)
      },
      storageKeyPrefix: `SC_${import.meta.env.MODE}_`,
      extraAuthParameters: {
        audience: cfg.oauthAudience || 'web://api',
      },
      extraTokenParameters: {
        resource: cfg.oauthAudience || 'web://api',
      },
    }
  }, [missingVars])

  if (!authConfig) {
    return <ConfigErrorPage missingVars={missingVars} />
  }

  return (
    <AuthProvider authConfig={authConfig}>
      <RouterContextUpdater router={router}>
        {children}
      </RouterContextUpdater>
    </AuthProvider>
  )
}
