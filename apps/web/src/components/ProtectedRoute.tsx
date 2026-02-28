import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const {
    token,
    loginInProgress,
    isAuthReady,
    userInfoError,
    rpcUserInfoError,
    userInfoLoading,
    rpcUserInfoLoading
  } = useAuth()

  // No logIn() call here — _app.tsx beforeLoad already redirects unauthenticated
  // users to /login. Calling logIn() here caused a race condition: the library
  // transiently clears loginInProgress before setting the token, so this component
  // would see !token && !loginInProgress and trigger a second OAuth redirect.

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{loginInProgress ? 'Authenticating...' : 'Redirecting to login...'}</p>
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
