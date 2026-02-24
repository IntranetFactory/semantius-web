import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ErrorPage } from '@/components/ErrorPage'
import { NotFoundPage } from '@/components/NotFoundPage'

// Define the router context interface
export interface RouterContext {
  auth: {
    isAuthenticated: () => boolean
    getToken: () => string | null
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <ErrorBoundary>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="top-right" />}
    </ErrorBoundary>
  )
}
