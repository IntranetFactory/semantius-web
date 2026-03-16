import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'
import { buildOAuthState } from '@/lib/oauthState'

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
    logIn(buildOAuthState(redirectTarget || '/'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // HTML overlay from index.html stays visible while we redirect to the OAuth provider
  return null
}
