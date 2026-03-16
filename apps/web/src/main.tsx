import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProviderWrapper } from './contexts/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from './components/ui/sonner'
import type { RouterContext } from './routes/__root'
import { initConfig, getConfigError } from './lib/config'
import { hideAppLoader } from './lib/appLoader'
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

const root = createRoot(document.getElementById('root')!)

// Load config (async) before rendering the app
initConfig().then(() => {
  const configError = getConfigError()

  if (configError) {
    hideAppLoader()
    root.render(
      <StrictMode>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
          <div style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Configuration Error</h1>
            <p style={{ color: '#666', marginBottom: '1rem' }}>The application could not load its configuration.</p>
            <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{configError}</pre>
          </div>
        </div>
      </StrictMode>,
    )
    return
  }

  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="semantius-ui-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProviderWrapper router={router}>
            <RouterProvider router={router} />
          </AuthProviderWrapper>
          <ReactQueryDevtools initialIsOpen={false} />
          <Toaster position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  )
})
