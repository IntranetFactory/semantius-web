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
    moduleSlug: string
  }) => {
    const { homePage, moduleSlug } = options
    const trimmedHomePage = homePage?.trim() || ''

    // If home_page is set and not just "/", navigate directly
    if (trimmedHomePage && trimmedHomePage !== '/') {
      navigate({ to: trimmedHomePage })
      return
    }

    // home_page is "/" or empty — navigate to the module root using slug
    navigate({ to: `/${moduleSlug}` })
  }
}
