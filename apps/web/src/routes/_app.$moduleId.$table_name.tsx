// routes/$moduleId.$table_name.$key.tsx
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'
import { lazy, Suspense, useMemo } from 'react'
import { NotFoundPage } from '@/components/NotFoundPage'

// Discover all view components - lazy load for code splitting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viewComponents = import.meta.glob<Record<string, React.ComponentType<any>>>(
  '../components/views/**/*.{tsx,jsx}',
  { eager: false }
)

// Cache for lazy components to prevent recreation
const lazyComponentCache = new Map<string, React.ComponentType<any>>()

export const Route = createFileRoute('/_app/$moduleId/$table_name')({
  shouldReload: false, // Never reload - metadata doesn't change
  loader: async ({ params, context }) => {
    const { table_name } = params
    const token = context.auth.getToken()
    
    // Try to fetch metadata - if it fails, return 404
    const metadata = await fetchEntityMetadata(table_name, token)
    if (!metadata) {
      throw notFound()
    }
    
    return { metadata }
  },
  component: RouteComponent,
  notFoundComponent: NotFoundPage,
})

function RouteComponent() {
  const { moduleId, table_name, key } = useParams({ strict: false })
  const { metadata } = Route.useLoaderData()
  
  // Get or create lazy component (cached to prevent Suspense flickering on key changes)
  const Component = useMemo(() => {
    if (!table_name) return null
    
    const componentName = table_name.charAt(0).toUpperCase() + table_name.slice(1)
    const specificComponentPath = `../components/views/${moduleId}/${componentName}.tsx`
    const genericComponentPath = '../components/views/View.tsx'
    
    const componentPath = specificComponentPath in viewComponents 
      ? specificComponentPath 
      : genericComponentPath
    
    if (!lazyComponentCache.has(componentPath)) {
      lazyComponentCache.set(
        componentPath,
        lazy(() => 
          viewComponents[componentPath]().then(m => ({ 
            default: m[componentName] || m.View || m.default 
          }))
        )
      )
    }
    
    return lazyComponentCache.get(componentPath)!
  }, [table_name, moduleId])
  
  if (!Component) {
    return <div>Invalid table name</div>
  }
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component table_name={table_name} metadata={metadata} moduleId={moduleId} recordId={key} />
    </Suspense>
  )
}

/**
 * Fetch entity metadata using the get_schema RPC function
 * This follows the PostgREST RPC pattern for calling stored procedures
 */
async function fetchEntityMetadata(table_name: string, token: string | null) {
  if (!token) {
    throw new Error('Authentication token is required')
  }

  try {
    const { callRpc } = await import('@/lib/apiClient')
    return await callRpc('get_schema', { p_table_name: table_name }, token)
  } catch {
    return null
  }
}