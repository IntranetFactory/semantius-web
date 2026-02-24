import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
    expect(result).toContain('bg-blue-500')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('merges tailwind classes correctly', () => {
    // Should keep the last class when conflicting
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })
})
