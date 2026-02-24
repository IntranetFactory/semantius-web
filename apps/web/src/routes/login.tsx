import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'

// Key for tracking auto-retry attempts across page reloads within the same session
const AUTH_RETRY_COUNT_KEY = 'auth_auto_retry_count'
const MAX_AUTO_RETRIES = 2
const AUTO_RETRY_DELAY_MS = 1500

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
  const autoRetryScheduled = useRef(false)
  const [isAutoRetrying, setIsAutoRetrying] = useState(false)

  useEffect(() => {
    // If already logged in, redirect to home and reset retry counter
    if (token) {
      sessionStorage.removeItem(AUTH_RETRY_COUNT_KEY)
      navigate({ to: '/' })
    } else if (!loginInProgress && !error) {
      // If not logged in, no login in progress, and no error, automatically trigger OAuth login
      login()
    }
  }, [token, login, loginInProgress, navigate, error])

  // Auto-retry when a "Bad authorization state" error occurs.
  // This error means a previous login attempt left a stale loginInProgress flag in
  // localStorage (e.g. the user closed the browser mid-flow or navigated away before
  // the OIDC server returned the auth code). The library detects this mismatch and clears
  // the stale storage automatically before setting the error, so a fresh login() call here
  // will start a clean PKCE flow. We limit auto-retries via sessionStorage to prevent loops.
  useEffect(() => {
    if (!error || autoRetryScheduled.current) return

    const retryCount = Number(sessionStorage.getItem(AUTH_RETRY_COUNT_KEY)) || 0
    if (retryCount >= MAX_AUTO_RETRIES) return

    autoRetryScheduled.current = true
    sessionStorage.setItem(AUTH_RETRY_COUNT_KEY, String(retryCount + 1))
    setIsAutoRetrying(true)

    const timer = setTimeout(() => {
      login()
    }, AUTO_RETRY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [error, login])

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

  // Show auto-retrying state
  if (isAutoRetrying) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Retrying login...</h2>
          <p className="mt-2 text-muted-foreground">Clearing stale session state and starting a fresh login.</p>
        </div>
      </div>
    )
  }

  // Show error state if OAuth library encountered an error (and auto-retry limit reached)
  if (error) {
    const isBadAuthState = error.includes('Bad authorization state')
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Login Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was an issue with the authentication process. This can happen if you navigated back after logging out.
          </p>
          {isBadAuthState && (
            <p className="mt-2 text-sm text-muted-foreground">
              A previous login attempt left incomplete session data in your browser storage
              (e.g. the browser was closed or the page was reloaded before the login completed).
              The stale data has been cleared automatically. Clicking <strong>Try Again</strong> will start a fresh login.
            </p>
          )}
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <div className="mt-6 space-y-3">
            <Button 
              onClick={() => {
                sessionStorage.removeItem(AUTH_RETRY_COUNT_KEY)
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
