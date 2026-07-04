import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseOAuthState } from '@/lib/oauthState'
import { hideAppLoader } from '@/lib/appLoader'

export const Route = createFileRoute('/oauth2_callback')({
  component: CallbackComponent,
})

// Caps automatic recovery from a failed token exchange (expired/replayed code,
// PKCE race) at a single fresh logIn(). sessionStorage (not localStorage) so the
// budget is scoped to this tab/session and resets naturally; it survives the
// logIn() redirect because that stays in the same tab.
const RETRY_KEY = 'SC_oauth_retry'

function CallbackComponent() {
  const { token, error, logIn, loginInProgress } = useAuth()
  const navigate = useNavigate()

  // Freeze whether an OAuth code was present at mount time. The library may
  // strip ?code= from the URL before the token exchange completes, so we
  // capture this once instead of re-reading window.location.search on every
  // render.
  const [hadOAuthCode] = useState(() => new URLSearchParams(window.location.search).has('code'))

  // The redirect target is encoded in the OAuth state parameter (stored in
  // localStorage by the library before the redirect). The state format is
  // `<nonce>:<redirectPath>` — parseOAuthState extracts the path.
  const [redirectTarget] = useState(() => parseOAuthState(localStorage.getItem('ROCP_auth_state')))

  // Safety timeout: if nothing happens within 5 seconds, the token exchange
  // likely never started (e.g. loginInProgress was already cleared after a
  // long break). Without this, the page hangs on the loading spinner forever.
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Auto-recover once from a failed token exchange. The auth code is single-use
  // and short-lived, so we never re-submit it — logIn() requests a brand-new
  // code. The retry counter caps this at one automatic attempt: a persistent
  // failure (clock skew, PKCE/config mismatch) then falls through to the manual
  // error UI instead of looping /login → provider → callback → error forever.
  const [autoRetrying, setAutoRetrying] = useState(false)
  useEffect(() => {
    if (!error) return
    const attempts = Number(sessionStorage.getItem(RETRY_KEY) || '0')
    if (attempts < 1) {
      sessionStorage.setItem(RETRY_KEY, String(attempts + 1))
      setAutoRetrying(true)
      logIn()
    }
  }, [error, logIn])

  useEffect(() => {
    if (token) {
      // Successful exchange — reset the auto-retry budget for next time.
      sessionStorage.removeItem(RETRY_KEY)
      navigate({ to: redirectTarget || '/' })
    } else if (!hadOAuthCode && !error) {
      // Arrived at /oauth2_callback without an OAuth code — no active flow, send to login
      navigate({ to: '/login' })
    } else if (hadOAuthCode && !loginInProgress && !token && !error && timedOut) {
      // The library skipped the token exchange (loginInProgress was false in
      // storage, e.g. after a long break or stale callback URL). Restart the
      // login flow instead of hanging forever.
      logIn()
    }
  }, [token, hadOAuthCode, error, loginInProgress, timedOut, navigate, redirectTarget, logIn])

  if (error && !autoRetrying) {
    // Auth error that we won't auto-recover from — needs user interaction, so
    // hide the loading overlay to show the error UI. (While autoRetrying is
    // true a fresh logIn() redirect is in flight; keep the spinner up.)
    hideAppLoader()
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

  // HTML overlay stays visible while completing the token exchange
  return null
}
