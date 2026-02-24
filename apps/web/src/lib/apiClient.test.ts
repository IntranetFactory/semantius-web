import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getApiConfig, createApiHeaders, buildPostgRESTSelect } from './apiClient'

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_API_TYPE', '')
    vi.stubEnv('VITE_SUPABASE_APIKEY', '')
  })

  describe('getApiConfig', () => {
    it('returns API configuration from environment variables', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', 'postgrest')
      vi.stubEnv('VITE_SUPABASE_APIKEY', '')

      const config = getApiConfig()

      expect(config).toEqual({
        baseUrl: 'https://api.example.com',
        type: 'postgrest',
        supabaseApiKey: '',
      })
    })

    it('normalizes API type to lowercase', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', 'SUPABASE')
      vi.stubEnv('VITE_SUPABASE_APIKEY', 'test-key')

      const config = getApiConfig()

      expect(config.type).toBe('supabase')
    })

    it('handles empty API type', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      // API_TYPE not set (will be empty string)

      const config = getApiConfig()

      expect(config.type).toBeUndefined()
    })
  })

  describe('createApiHeaders', () => {
    it('creates basic headers with Authorization and Content-Type', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', '')

      const headers = createApiHeaders('test-token')

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      })
    })

    it('adds Supabase apikey header when API_TYPE is supabase', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', 'supabase')
      vi.stubEnv('VITE_SUPABASE_APIKEY', 'supabase-key')

      const headers = createApiHeaders('test-token')

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'apikey': 'supabase-key',
      })
    })

    it('does not add apikey header when API_TYPE is not supabase', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', 'postgrest')
      vi.stubEnv('VITE_SUPABASE_APIKEY', 'supabase-key')

      const headers = createApiHeaders('test-token')

      expect(headers).not.toHaveProperty('apikey')
    })

    it('does not add apikey header when Supabase key is missing', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', 'supabase')
      vi.stubEnv('VITE_SUPABASE_APIKEY', '')

      const headers = createApiHeaders('test-token')

      expect(headers).not.toHaveProperty('apikey')
    })

    it('accepts configuration override options', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', '')

      const headers = createApiHeaders('test-token', {
        type: 'supabase',
        supabaseApiKey: 'custom-key',
      })

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'apikey': 'custom-key',
      })
    })

    it('merges override options with environment config', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
      vi.stubEnv('VITE_API_TYPE', 'supabase')
      vi.stubEnv('VITE_SUPABASE_APIKEY', 'env-key')

      const headers = createApiHeaders('test-token', {
        supabaseApiKey: 'override-key',
      })

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'apikey': 'override-key',
      })
    })
  })

  describe('buildPostgRESTSelect', () => {
    it('returns * when metadata has no properties', () => {
      const metadata = { properties: undefined }
      const result = buildPostgRESTSelect(metadata)
      expect(result).toBe('*')
    })

    it('includes all fields in select clause', () => {
      const metadata = {
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      }
      const result = buildPostgRESTSelect(metadata)
      expect(result).toBe('id,name,email')
    })

    it('adds aliased _label field for reference columns', () => {
      const metadata = {
        properties: {
          id: { type: 'integer' },
          product_name: { type: 'string' },
          category_id: {
            type: 'integer',
            reference_table: 'product_categories',
            reference_table_label_column: 'category_name',
          },
        },
      }
      const result = buildPostgRESTSelect(metadata)
      expect(result).toBe('id,product_name,category_id,category_id_label:product_categories!category_id(category_name)')
    })

    it('handles multiple columns referencing the same table (PGRST201 fix)', () => {
      // This tests the case where user_roles has two foreign keys to users table:
      // - user_id -> users(id)
      // - assigned_by -> users(id)
      const metadata = {
        properties: {
          id: { type: 'integer' },
          user_id: {
            type: 'integer',
            reference_table: 'users',
            reference_table_label_column: 'name',
          },
          assigned_by: {
            type: 'integer',
            reference_table: 'users',
            reference_table_label_column: 'name',
          },
          role_name: { type: 'string' },
        },
      }
      const result = buildPostgRESTSelect(metadata)
      // Each reference gets its own aliased field with the column name as the relationship hint
      // This solves PostgREST PGRST201 ambiguous relationship error
      expect(result).toBe('id,user_id,user_id_label:users!user_id(name),assigned_by,assigned_by_label:users!assigned_by(name),role_name')
    })

    it('only adds _label field when both reference_table and reference_table_label_column are present', () => {
      const metadata = {
        properties: {
          id: { type: 'integer' },
          category_id: {
            type: 'integer',
            reference_table: 'product_categories',
            // Missing reference_table_label_column
          },
        },
      }
      const result = buildPostgRESTSelect(metadata)
      expect(result).toBe('id,category_id')
    })
  })
})
