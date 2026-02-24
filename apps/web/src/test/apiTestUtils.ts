/**
 * Test utilities for mocking API configuration
 * 
 * This module provides helper functions for setting up API configuration
 * in test environments, ensuring consistency across all test files.
 */

import { vi } from 'vitest'

export interface MockApiConfigOptions {
  baseUrl?: string
  type?: string
  supabaseApiKey?: string
}

/**
 * Setup API configuration environment variables for tests
 * 
 * @param options - API configuration options
 * 
 * @example
 * // Setup default PostgREST API
 * setupMockApiConfig()
 * 
 * @example
 * // Setup Supabase configuration
 * setupMockApiConfig({
 *   baseUrl: 'https://api.example.com',
 *   type: 'supabase',
 *   supabaseApiKey: 'test-key'
 * })
 */
export function setupMockApiConfig(options: MockApiConfigOptions = {}) {
  const {
    baseUrl = 'https://api.example.com',
    type = '',
    supabaseApiKey = '',
  } = options

  vi.stubEnv('VITE_API_BASE_URL', baseUrl)
  vi.stubEnv('VITE_API_TYPE', type)
  vi.stubEnv('VITE_SUPABASE_APIKEY', supabaseApiKey)
}
