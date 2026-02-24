import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext'

/**
 * Custom hook that provides unified OAuth authentication and user info
 * 
 * This hook provides access to:
 * - OAuth tokens and authentication state
 * - Login/logout methods
 * - User information from OIDC userinfo endpoint
 * - RPC user information with modules and permissions
 * 
 * @returns Combined auth context with user info
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProviderWrapper')
  }
  return context
}

