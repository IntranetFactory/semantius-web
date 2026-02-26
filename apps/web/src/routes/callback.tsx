import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/callback')({
  component: CallbackComponent,
})

function CallbackComponent() {
  const { token, error, logIn } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()

  // Freeze whether an OAuth code was present at mount time. The library may
  // strip ?code= from the URL before the token exchange completes, so we
  // capture this once instead of re-reading window.location.search on every
  // render. loginInProgress is not reliable here because the library clears
  // it before the token is set, causing a false "no active flow" signal.
  const [hadOAuthCode] = useState(() => new URLSearchParams(window.location.search).has('code'))

  useEffect(() => {
    if (token) {
      navigate({ to: (search as any).redirect || '/' })
    } else if (!hadOAuthCode && !error) {
      // Arrived at /callback without an OAuth code — no active flow, send to login
      navigate({ to: '/login' })
    }
  }, [token, hadOAuthCode, error, navigate, search])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Login Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was an issue completing authentication.
          </p>
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <div className="mt-6 space-y-3">
            <Button onClick={() => logIn()} className="w-full">
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
        <h2 className="mt-4 text-xl font-semibold">Completing sign-in...</h2>
        <p className="mt-2 text-muted-foreground">Please wait.</p>
      </div>
    </div>
  )
}
