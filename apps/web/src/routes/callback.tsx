import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/callback')({
  component: CallbackComponent,
})

function CallbackComponent() {
  const { token, loginInProgress, error, logIn } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()

  useEffect(() => {
    if (token) {
      navigate({ to: (search as any).redirect || '/' })
    } else if (!loginInProgress && !error) {
      // Arrived at /callback without an active OAuth flow — send to login
      navigate({ to: '/login' })
    }
  }, [token, loginInProgress, error, navigate, search])

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
