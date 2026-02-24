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

    if (loginInProgress) return

    const params = new URLSearchParams(window.location.search)

    if (params.has('code')) {
      // Returning from the identity provider with an auth code.
      // The library's own useEffect checks loginInProgress and exchanges the code.
      return
    }

    if (params.has('error') || params.has('error_description')) {
      // The identity provider returned an explicit error — let the error UI handle it.
      return
    }

    // No code and no OIDC error in the URL → start (or restart) login.
    // This covers the normal first-visit case AND the "Bad authorization state" recovery:
    // the library clears the stale loginInProgress flag before raising that error,
    // so login() here starts a clean PKCE flow without any special-casing.
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
    // Shown for genuine OIDC errors returned in the redirect (e.g. ?error=access_denied).
    // "Bad authorization state" should self-heal via the useEffect above and never reach
    // here under normal conditions, but we keep this UI as a safety net.
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
