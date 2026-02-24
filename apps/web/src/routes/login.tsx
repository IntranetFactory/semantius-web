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
    if (token) {
      navigate({ to: '/' })
      return
    }

    const params = new URLSearchParams(window.location.search)

    // Auth code present: the library exchanges it for tokens when loginInProgress=true.
    // When loginInProgress=false the exchange has completed (token set → navigate above)
    // or failed (error state will be shown by the error UI below).
    if (params.has('code')) return

    // Explicit error from the identity provider (e.g. ?error=access_denied).
    // The library sets error state and clears loginInProgress when it sees this, so we
    // return here — both before and after that happens — to avoid overwriting the error
    // by restarting the login flow.
    if (params.has('error') || params.has('error_description')) return

    // No code and no IdP error in the URL.
    // Guard: if login() was already called (loginInProgress=true), the browser is either
    // still redirecting to the IdP, or the library is about to process a bad-auth-state
    // (no code despite loginInProgress) and will clear loginInProgress before our next
    // render, at which point this effect re-runs and falls through to login() below.
    if (loginInProgress) return

    // Start (or restart) a fresh login.
    // This handles first visits and automatic recovery from "Bad authorization state":
    // the library clears loginInProgress before raising that error, so login() here
    // begins a clean PKCE flow without any special-casing.
    login()
  }, [token, login, loginInProgress, navigate])

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

  if (error) {
    const isBadAuthState = error.includes('Bad authorization state')
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Login Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was an issue with the authentication process.
          </p>
          {isBadAuthState && (
            <p className="mt-2 text-sm text-muted-foreground">
              The login was interrupted — you navigated back to the app before completing
              sign-in at the identity provider. The incomplete login state has been cleared.
              Click <strong>Try Again</strong> to start a fresh login.
            </p>
          )}
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <div className="mt-6 space-y-3">
            <Button onClick={() => login()} className="w-full">
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

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Loading...</h2>
      </div>
    </div>
  )
}
