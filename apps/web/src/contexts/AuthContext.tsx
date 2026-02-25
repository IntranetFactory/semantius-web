import { type ReactNode, useEffect, useLayoutEffect, useContext, useState, useRef, createContext } from 'react'
import { AuthProvider, AuthContext as OAuthContext } from 'react-oauth2-code-pkce'
import type { IAuthContext } from 'react-oauth2-code-pkce'
import { ConfigErrorPage } from '@/components/ConfigErrorPage'
import { getApiConfig, createApiHeaders } from '@/lib/apiClient'
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

// Validate OAuth configuration
function validateConfig() {
  const missingVars: string[] = []
  
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID
  const authEndpoint = import.meta.env.VITE_OAUTH_AUTH_ENDPOINT
  const tokenEndpoint = import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT
  const { baseUrl: apiBaseUrl, type: apiType, supabaseApiKey } = getApiConfig()
  
  // Check if required variables are missing or contain placeholder values
  if (!clientId || containsPlaceholder(clientId)) {
    missingVars.push('VITE_OAUTH_CLIENT_ID')
  }
  
  if (!authEndpoint || containsPlaceholder(authEndpoint)) {
    missingVars.push('VITE_OAUTH_AUTH_ENDPOINT')
  }
  
  if (!tokenEndpoint || containsPlaceholder(tokenEndpoint)) {
    missingVars.push('VITE_OAUTH_TOKEN_ENDPOINT')
  }
  
  if (!apiBaseUrl || containsPlaceholder(apiBaseUrl)) {
    missingVars.push('VITE_API_BASE_URL')
  }

  // If API_TYPE is set to 'supabase', validate VITE_SUPABASE_APIKEY is present
  if (apiType === 'supabase') {
    if (!supabaseApiKey || supabaseApiKey.trim() === '') {
      missingVars.push('VITE_SUPABASE_APIKEY (required when VITE_API_TYPE=supabase)')
    }
  }
  
  return missingVars
}

// OAuth configuration - NO defaults, fail if not configured
const missingVars = validateConfig()
const isConfigValid = missingVars.length === 0

const authConfig = isConfigValid ? {
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID!,
  authorizationEndpoint: import.meta.env.VITE_OAUTH_AUTH_ENDPOINT!,
  tokenEndpoint: import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT!,
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/callback`,
  scope: import.meta.env.VITE_OAUTH_SCOPE || 'openid profile email',
  logoutEndpoint: import.meta.env.VITE_OAUTH_LOGOUT_ENDPOINT,
  autoLogin: false,
  storageKeyPrefix: `SC_${import.meta.env.MODE}_`,
  // Add audience parameter for Auth0 and other providers that require it
  ...(import.meta.env.VITE_OAUTH_AUDIENCE && {
    extraAuthParameters: {
      audience: import.meta.env.VITE_OAUTH_AUDIENCE,
    },
  }),
} : null

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
  
  // Update router context synchronously before any child useEffect hooks run.
  // useLayoutEffect fires before paint and before passive effects (useEffect),
  // so the router context is always up-to-date when CallbackComponent's
  // useEffect calls navigate() — preventing the race condition where
  // _app.tsx's beforeLoad would see isAuthenticated=false on first login.
  useLayoutEffect(() => {
    const isAuthenticated = !!token && !!tokenData && tokenData.exp * 1000 > Date.now()
    
    router.update({
      context: {
        auth: {
          isAuthenticated: () => isAuthenticated,
          getToken: () => token || null,
        },
      } satisfies RouterContext,
    })
    
    // Invalidate router to re-run loaders and beforeLoad checks
    router.invalidate()
  }, [token, tokenData, router])
  
  // Fetch user info from both userinfo endpoint and /rpc/get_userinfo in parallel
  useEffect(() => {
    const fetchUserInfoData = async () => {
      const userinfoEndpoint = import.meta.env.VITE_OAUTH_USERINFO_ENDPOINT
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

      // Skip if already fetched for this token
      if (fetchedTokenRef.current === token) {
        return
      }

      fetchedTokenRef.current = token
      setUserInfoError(null)
      setRpcUserInfoError(null)
      setIsAuthReady(false)

      // Determine which fetches to perform
      const shouldFetchOAuthUserInfo = !!userinfoEndpoint
      const shouldFetchRpcUserInfo = !!apiBaseUrl

      // Set loading states based on which fetches will be performed
      setUserInfoLoading(shouldFetchOAuthUserInfo)
      setRpcUserInfoLoading(shouldFetchRpcUserInfo)

      // Fetch both in parallel
      const promises: Promise<boolean>[] = []

      // Fetch OAuth userinfo if endpoint is configured
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

      // Fetch RPC userinfo if API base URL is configured
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

      // Wait for both fetches to complete
      if (promises.length > 0) {
        await Promise.all(promises)
      }

      // Mark auth as ready once all fetches complete
      setIsAuthReady(true)
    }

    fetchUserInfoData()
  }, [token])
  
  // Provide combined context
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
  // Show config error page if configuration is invalid
  if (!isConfigValid || !authConfig) {
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
