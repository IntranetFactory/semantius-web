import { describe, it, expect } from 'vitest'
import { formatDateForDisplay, isDateFormat } from './date-format'

describe('isDateFormat', () => {
  it('recognizes date/date-time/time', () => {
    expect(isDateFormat('date')).toBe(true)
    expect(isDateFormat('date-time')).toBe(true)
    expect(isDateFormat('time')).toBe(true)
  })
  it('rejects other/undefined formats', () => {
    expect(isDateFormat('email')).toBe(false)
    expect(isDateFormat(undefined)).toBe(false)
  })
})

describe('formatDateForDisplay', () => {
  it('formats a date-only value with the locale (en-US)', () => {
    expect(formatDateForDisplay('2026-11-01', 'date', { locale: 'en-US' })).toBe('11/1/2026')
  })
  it('formats a date-only value with the locale (de-DE)', () => {
    expect(formatDateForDisplay('2026-11-01', 'date', { locale: 'de-DE' })).toBe('1.11.2026')
  })
  it('does not shift a date-only value across the day boundary', () => {
    // "2026-11-01" must stay Nov 1 regardless of the runtime time zone — a naive
    // new Date('2026-11-01') would be UTC midnight and slip to Oct 31 in the US.
    expect(formatDateForDisplay('2026-11-01', 'date', { locale: 'en-US' })).toBe('11/1/2026')
  })
  it('formats a date-time value with date + time', () => {
    const out = formatDateForDisplay('2026-11-01T14:30:00', 'date-time', { locale: 'en-US' })
    expect(out).toContain('11/1/2026')
    expect(out).toMatch(/02:30/)
  })
  it('formats a bare time value', () => {
    expect(formatDateForDisplay('09:05', 'time', { locale: 'en-GB' })).toMatch(/09:05/)
  })
  it('blank for null/undefined/empty', () => {
    expect(formatDateForDisplay(null, 'date')).toBe('')
    expect(formatDateForDisplay(undefined, 'date')).toBe('')
    expect(formatDateForDisplay('', 'date')).toBe('')
  })
  it('returns the raw value when unparseable', () => {
    expect(formatDateForDisplay('not-a-date', 'date')).toBe('not-a-date')
  })
})
