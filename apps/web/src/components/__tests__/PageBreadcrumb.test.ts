import { describe, it, expect } from 'vitest'
import { buildBreadcrumbSegments } from '../PageBreadcrumb'

describe('buildBreadcrumbSegments', () => {
  it('builds segments from a simple path', () => {
    const segments = buildBreadcrumbSegments('/crm/customers')
    expect(segments).toEqual([
      { label: 'CRM', href: '/crm' },
      { label: 'Customers', href: undefined },
    ])
  })

  it('builds segments with a record ID', () => {
    const segments = buildBreadcrumbSegments('/crm/customers/70')
    expect(segments).toEqual([
      { label: 'CRM', href: '/crm' },
      { label: 'Customers', href: '/crm/customers' },
      { label: '70', href: undefined },
    ])
  })

  it('strips trailing /view segment', () => {
    const segments = buildBreadcrumbSegments('/crm/customers/70/view')
    expect(segments).toEqual([
      { label: 'CRM', href: '/crm' },
      { label: 'Customers', href: '/crm/customers' },
      { label: '70', href: undefined },
    ])
  })

  it('strips trailing /edit segment', () => {
    const segments = buildBreadcrumbSegments('/crm/customers/70/edit')
    expect(segments).toEqual([
      { label: 'CRM', href: '/crm' },
      { label: 'Customers', href: '/crm/customers' },
      { label: '70', href: undefined },
    ])
  })

  it('strips trailing /new segment', () => {
    const segments = buildBreadcrumbSegments('/crm/customers/new')
    expect(segments).toEqual([
      { label: 'CRM', href: '/crm' },
      { label: 'Customers', href: undefined },
    ])
  })

  it('uses custom labels when provided', () => {
    const labels = { crm: 'CRM', customers: 'All Customers' }
    const segments = buildBreadcrumbSegments('/crm/customers/70/view', labels)
    expect(segments).toEqual([
      { label: 'CRM', href: '/crm' },
      { label: 'All Customers', href: '/crm/customers' },
      { label: '70', href: undefined },
    ])
  })

  it('returns empty for empty path', () => {
    const segments = buildBreadcrumbSegments('/')
    expect(segments).toEqual([])
  })

  it('handles hyphenated and underscored segment names', () => {
    const segments = buildBreadcrumbSegments('/admin/user-roles')
    expect(segments).toEqual([
      { label: 'ADMIN', href: '/admin' },
      { label: 'User Roles', href: undefined },
    ])
  })
})
