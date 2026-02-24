import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/logout')({
  component: LogoutRoute,
})

function LogoutRoute() {
  const { logOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const performLogout = async () => {
      const logoutEndpoint = import.meta.env.VITE_OAUTH_LOGOUT_ENDPOINT
      const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID
      
      // ALWAYS clear our local session first
      logOut()
      
      if (logoutEndpoint) {
        // IDP has a logout endpoint (like Auth0) - redirect there AFTER clearing local session
        // Auth0 is a one-way trip - it won't return to our app
        // Add small delay to ensure local logout completes
        setTimeout(() => {
          const logoutUrl = new URL(logoutEndpoint)
          if (clientId) {
            logoutUrl.searchParams.set('client_id', clientId)
          }
          
          window.location.href = logoutUrl.toString()
        }, 100)
      } else {
        // No logout endpoint - show our own logout confirmation page
        // Use navigate after a brief delay to ensure logout completes
        setTimeout(() => {
          navigate({ to: '/logout-success' })
        }, 100)
      }
    }

    performLogout()
  }, [logOut, navigate])

  // Show a simple message while logout is processing
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Logging out...</h2>
        <p className="mt-2 text-muted-foreground">Please wait while we log you out.</p>
      </div>
    </div>
  )
}
