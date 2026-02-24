import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context, search }) => {
    // If user is authenticated, redirect to the intended page or home
    if (context.auth.isAuthenticated()) {
      throw redirect({
        to: (search as any).redirect || '/',
      })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const { token, login, loginInProgress, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // If already logged in, redirect to home
    if (token) {
      navigate({ to: '/' })
    } else if (!loginInProgress && !error) {
      // If not logged in, no login in progress, and no error, automatically trigger OAuth login
      login()
    }
  }, [token, login, loginInProgress, navigate, error])

  // Show loading state while login is in progress
  if (loginInProgress) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Redirecting to login...</h2>
          <p className="mt-2 text-muted-foreground">Please wait while we redirect you to the sign-in page.</p>
        </div>
      </div>
    )
  }

  // Show error state if OAuth library encountered an error
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Login Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was an issue with the authentication process. This can happen if you navigated back after logging out.
          </p>
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <div className="mt-6 space-y-3">
            <Button 
              onClick={() => {
                // Clear any stale auth state and trigger fresh login
                login()
              }} 
              className="w-full"
            >
              Try Again
            </Button>
            <p className="text-xs text-muted-foreground">
              If the problem persists, try refreshing the page or clearing your browser cache.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show minimal loading state while waiting for auto-login to trigger
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Loading...</h2>
      </div>
    </div>
  )
}
