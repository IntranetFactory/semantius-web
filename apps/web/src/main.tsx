import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProviderWrapper } from './contexts/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import type { RouterContext } from './routes/__root'
import './global.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance with context
const router = createRouter({ 
  routeTree,
  context: {
    auth: {
      isAuthenticated: () => false,
      getToken: () => null,
    },
  } satisfies RouterContext,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Export router for use in AuthContext (for invalidation)
export { router }

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnMount: 'always', // Always refetch when component mounts (even if fresh)
      refetchOnWindowFocus: 'always', // Always refetch when window regains focus (even if fresh)
      refetchOnReconnect: true, // Always refetch when reconnecting to network
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="semantius-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProviderWrapper router={router}>
          <RouterProvider router={router} />
        </AuthProviderWrapper>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

