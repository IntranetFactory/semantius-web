import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { getApiConfig, createApiHeaders } from '@/lib/apiClient'

/**
 * Hook that returns a function to navigate to a module's home page.
 * When a module's home_page is empty or "/", it navigates to the module slug.
 */
export function useModuleNavigate() {
  const navigate = useNavigate()
  const { token } = useAuth()
  // `token` is kept for the commented-out first-entity fallback below.
  void token

  return async (options: {
    homePage?: string
    moduleId?: number
    moduleName: string
  }) => {
    const { homePage, moduleName } = options
    const trimmedHomePage = homePage?.trim() || ''

    // If home_page is set and not just "/", navigate directly
    if (trimmedHomePage && trimmedHomePage !== '/') {
      navigate({ to: trimmedHomePage })
      return
    }

    // home_page is "/" or empty — navigate to the module root
    navigate({ to: `/${moduleName.toLowerCase()}` })

    // Previous behaviour: fetch the module's first non-child entity and
    // redirect to it. Kept for potential future reuse.
    //
    // if (moduleId && token) {
    //   try {
    //     const { baseUrl } = getApiConfig()
    //     const headers = createApiHeaders(token)
    //     const response = await fetch(
    //       `${baseUrl}/tables?module_id=eq.${moduleId}&is_child=not.is.true&select=table_name&limit=1`,
    //       { headers }
    //     )
    //     if (response.ok) {
    //       const tables = await response.json() as { table_name: string }[]
    //       if (tables.length > 0) {
    //         const lowercasedName = moduleName.toLowerCase()
    //         navigate({ to: `/${lowercasedName}/${tables[0].table_name}` })
    //         return
    //       }
    //     }
    //   } catch {
    //     // Fall through to fallback
    //   }
    // }
  }
}
