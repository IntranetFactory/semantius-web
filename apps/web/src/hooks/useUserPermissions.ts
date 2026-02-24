/**
 * Permission checking utilities
 * 
 * These functions work with user permissions from /rpc/get_userinfo
 */

import { useAuth } from '@/hooks/useAuth'

/**
 * Hook to check if the current user has a specific permission
 * @param name - The permission to check (e.g., "customers.edit")
 * @returns true if user has the permission, false otherwise
 */
export function useUserHasPermission(name: string): boolean {
  const { rpcUserInfo } = useAuth()
  
  if (!rpcUserInfo) return false
  
  const permissions = rpcUserInfo.permissions as string[] | undefined
  if (!permissions || !Array.isArray(permissions)) return false
  
  return permissions.includes(name)
}

/**
 * Hook to check if the current user has ANY of the specified permissions
 * @param names - Array of permissions to check (e.g., ["customers.edit", "customers.delete"])
 * @returns true if user has at least one of the permissions, false otherwise
 */
export function useUserHasAnyPermission(names: string[]): boolean {
  const { rpcUserInfo } = useAuth()
  
  if (!rpcUserInfo || names.length === 0) return false
  
  const permissions = rpcUserInfo.permissions as string[] | undefined
  if (!permissions || !Array.isArray(permissions)) return false
  
  return names.some(name => permissions.includes(name))
}

/**
 * Hook to check if the current user has ALL of the specified permissions
 * @param names - Array of permissions to check (e.g., ["customers.edit", "customers.delete"])
 * @returns true if user has all of the permissions, false otherwise
 */
export function useUserHasAllPermissions(names: string[]): boolean {
  const { rpcUserInfo } = useAuth()
  
  if (!rpcUserInfo || names.length === 0) return false
  
  const permissions = rpcUserInfo.permissions as string[] | undefined
  if (!permissions || !Array.isArray(permissions)) return false
  
  return names.every(name => permissions.includes(name))
}
