/**
 * Test utilities for mocking API configuration
 *
 * This module provides helper functions for setting up API configuration
 * in test environments, ensuring consistency across all test files.
 */

import { vi } from 'vitest'
import { initConfig } from '@/lib/config'

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
 * await setupMockApiConfig()
 *
 * @example
 * // Setup Supabase configuration
 * await setupMockApiConfig({
 *   baseUrl: 'https://api.example.com',
 *   type: 'supabase',
 *   supabaseApiKey: 'test-key'
 * })
 */
export async function setupMockApiConfig(options: MockApiConfigOptions = {}) {
  const {
    baseUrl = 'https://api.example.com',
    type = '',
    supabaseApiKey = '',
  } = options

  vi.stubEnv('VITE_API_BASE_URL', baseUrl)
  vi.stubEnv('VITE_API_TYPE', type)
  vi.stubEnv('VITE_SUPABASE_APIKEY', supabaseApiKey)
  // Re-init config singleton so getApiConfig() picks up stubbed values
  await initConfig()
}
