import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'
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
  const search = Route.useSearch()
  const calledRef = useRef(false)

  useEffect(() => {
    // Guard against React strict mode calling the effect twice — the second
    // logIn() would clearStorage() and clobber the first PKCE code verifier.
    if (calledRef.current) return
    calledRef.current = true

    const redirectTarget = (search as any).redirect
    logIn(redirectTarget || undefined)
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
