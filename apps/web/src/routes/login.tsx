import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context, search }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({
        to: (search as any).redirect || '/',
      })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const { logIn } = useAuth()

  useEffect(() => {
    // Always start a fresh OAuth flow. logIn() calls clearStorage() first,
    // so any stale loginInProgress state is reset before redirecting.
    logIn()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
