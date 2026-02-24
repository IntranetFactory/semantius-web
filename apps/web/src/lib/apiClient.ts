/**
 * Centralized API configuration
 * 
 * This module provides a single source of truth for API-related configuration
 * including base URL, API type, and provider-specific keys.
 */

import { type EntityMetadata } from "@/types/metadata"

export interface ApiConfig {
  baseUrl: string
  type?: string
  supabaseApiKey?: string
}

/**
 * Get API configuration from environment variables
 * 
 * @returns API configuration object
 */
export function getApiConfig(): ApiConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const apiTypeEnv = import.meta.env.VITE_API_TYPE
  const apiType = (typeof apiTypeEnv === 'string' && apiTypeEnv.trim() !== '') 
    ? apiTypeEnv.toLowerCase() 
    : undefined
  const supabaseApiKey = import.meta.env.VITE_SUPABASE_APIKEY

  return {
    baseUrl: apiBaseUrl,
    type: apiType,
    supabaseApiKey,
  }
}

/**
 * Create HTTP headers for API requests with proper authentication
 * 
 * @param token - OAuth Bearer token
 * @param options - Optional configuration overrides
 * @returns Headers object ready for fetch requests
 * 
 * @example
 * const headers = createApiHeaders(token)
 * fetch(url, { headers })
 * 
 * @example
 * // Override default config
 * const headers = createApiHeaders(token, { 
 *   baseUrl: 'https://custom-api.com',
 *   type: 'supabase',
 *   supabaseApiKey: 'custom-key'
 * })
 */
export function createApiHeaders(
  token: string,
  options?: Partial<ApiConfig>
): Record<string, string> {
  const config = options ? { ...getApiConfig(), ...options } : getApiConfig()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  // Add Supabase-specific apikey header if API_TYPE is supabase
  if (config.type === 'supabase' && config.supabaseApiKey) {
    headers['apikey'] = config.supabaseApiKey
  }

  return headers
}

/**
 * Call a PostgREST RPC function
 * DRY utility for all RPC calls - can be used in loaders and non-React contexts
 * 
 * @param rpcName - Name of the RPC function
 * @param params - Parameters to pass to the RPC function
 * @param token - Authentication token
 * @returns Promise with the RPC response
 * 
 * @example
 * const result = await callRpc('get_schema', { p_table_name: 'products' }, token)
 */
export async function callRpc<TResult = unknown, TParams = Record<string, unknown>>(
  rpcName: string,
  params: TParams,
  token: string
): Promise<TResult> {
  const { baseUrl: apiBaseUrl } = getApiConfig()
  const headers = createApiHeaders(token)

  const response = await fetch(`${apiBaseUrl}/rpc/${rpcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to call RPC function "${rpcName}"`
    
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorJson.error || errorText
    } catch {
      errorMessage = errorText || errorMessage
    }
    
    throw new Error(errorMessage)
  }

  return await response.json() as TResult
}

/**
 * Build PostgREST select clause with embedded resources for foreign key references
 * 
 * Analyzes entity metadata to detect reference fields (foreign keys) and builds
 * a select clause that includes embedded resources using PostgREST's resource embedding.
 * 
 * For example, if a 'category_id' field references 'product_categories' table,
 * the select will include: category_id,category_id_label:product_categories!category_id(category_name)
 * This creates a separate field with _label suffix containing the referenced label value.
 * 
 * @param metadata - Entity metadata containing schema with reference field information
 * @returns PostgREST select parameter string (e.g., "id,name,category_id,category_id_label:product_categories!category_id(category_name)")
 * 
 * @example
 * const select = buildPostgRESTSelect(productMetadata)
 * // Returns: "id,product_name,sku,description,price,quantity_in_stock,category_id,category_id_label:product_categories!category_id(category_name),is_discontinued,created_at,updated_at"
 */
export function buildPostgRESTSelect(metadata: EntityMetadata): string {
  const selects: string[] = []
  
  if (!metadata.properties) {
    return '*'
  }
  
  // Iterate through all properties to build select clause
  for (const [fieldName, property] of Object.entries(metadata.properties)) {
    // Always include the field itself (the ID)
    selects.push(fieldName)
    
    // If field has a foreign key reference, add aliased embedded resource
    // Using PostgREST aliasing: field_name_label:table!foreign_key(label_column)
    // This allows multiple references to the same table and makes sorting easier
    if (property.reference_table && property.reference_table_label_column) {
      selects.push(`${fieldName}_label:${property.reference_table}!${fieldName}(${property.reference_table_label_column})`)
    }
  }
  
  return selects.join(',')
}
