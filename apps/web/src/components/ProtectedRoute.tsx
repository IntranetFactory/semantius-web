import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { 
    token, 
    login, 
    loginInProgress, 
    isAuthReady, 
    userInfoError, 
    rpcUserInfoError,
    userInfoLoading,
    rpcUserInfoLoading
  } = useAuth()

  useEffect(() => {
    if (!token && !loginInProgress) {
      // Redirect to login - the auth library will handle the OAuth flow
      login()
    }
  }, [token, loginInProgress, login])

  if (loginInProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show errors if user info fetching has completed and there are errors
  if (!userInfoLoading && !rpcUserInfoLoading && (userInfoError || rpcUserInfoError)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full space-y-4">
          {userInfoError && (
            <ApiErrorDisplay 
              error={userInfoError} 
              title="Failed to fetch user information from OAuth provider"
            />
          )}
          {rpcUserInfoError && (
            <ApiErrorDisplay 
              error={rpcUserInfoError} 
              title="Failed to fetch user information from API"
            />
          )}
        </div>
      </div>
    )
  }

  // Wait for user info fetching to complete
  if (!isAuthReady || userInfoLoading || rpcUserInfoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading user information...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
