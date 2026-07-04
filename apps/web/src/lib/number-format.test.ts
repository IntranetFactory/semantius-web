import { describe, it, expect } from 'vitest'
import { formatNumberForDisplay, getNumberSeparators, resolvePrecision } from './number-format'

describe('getNumberSeparators', () => {
  it('en-US uses "," group and "." decimal', () => {
    expect(getNumberSeparators('en-US')).toEqual({ group: ',', decimal: '.' })
  })
  it('de-DE uses "." group and "," decimal', () => {
    expect(getNumberSeparators('de-DE')).toEqual({ group: '.', decimal: ',' })
  })
})

describe('resolvePrecision', () => {
  it('explicit precision wins over type', () => {
    expect(resolvePrecision({ type: 'number', precision: 2 })).toBe(2)
    expect(resolvePrecision({ type: 'integer', precision: 3 })).toBe(3)
    expect(resolvePrecision({ type: 'number', precision: 0 })).toBe(0)
  })
  it('integer with no precision → 0', () => {
    expect(resolvePrecision({ type: 'integer' })).toBe(0)
  })
  it('number with no precision → undefined (free decimals)', () => {
    expect(resolvePrecision({ type: 'number' })).toBeUndefined()
  })
  it('handles array type', () => {
    expect(resolvePrecision({ type: ['integer', 'null'] })).toBe(0)
  })
})

describe('formatNumberForDisplay', () => {
  it('formats with precision per locale', () => {
    expect(formatNumberForDisplay(7800, 2, { locale: 'en-US' })).toBe('7,800.00')
    expect(formatNumberForDisplay(7800, 2, { locale: 'de-DE' })).toBe('7.800,00')
    expect(formatNumberForDisplay(2400, 2, { locale: 'en-US' })).toBe('2,400.00')
  })
  it('coerces numeric strings (numeric/decimal columns can arrive as strings)', () => {
    expect(formatNumberForDisplay('2400', 2, { locale: 'en-US' })).toBe('2,400.00')
    expect(formatNumberForDisplay('7800.5', 2, { locale: 'de-DE' })).toBe('7.800,50')
  })
  it('integer precision 0 groups thousands', () => {
    expect(formatNumberForDisplay(1002, 0, { locale: 'en-US' })).toBe('1,002')
  })
  it('grouping can be disabled (e.g. id columns)', () => {
    expect(formatNumberForDisplay(1002, 0, { locale: 'en-US', grouping: false })).toBe('1002')
  })
  it('blank for null / undefined / empty', () => {
    expect(formatNumberForDisplay(null, 2)).toBe('')
    expect(formatNumberForDisplay(undefined, 2)).toBe('')
    expect(formatNumberForDisplay('', 2)).toBe('')
  })
  it('passes through non-numeric values unchanged', () => {
    expect(formatNumberForDisplay('N/A', 2)).toBe('N/A')
  })
  it('free decimals (no padding) when precision undefined', () => {
    expect(formatNumberForDisplay(1234.5, undefined, { locale: 'en-US' })).toBe('1,234.5')
    expect(formatNumberForDisplay(1234, undefined, { locale: 'en-US' })).toBe('1,234')
  })
})
