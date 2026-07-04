/**
 * Locale-aware date/time formatting for the data grid, so date-typed columns render
 * with the browser locale (e.g. "11/1/2026" for en-US, "01.11.2026" for de-DE) instead
 * of the raw ISO string ("2026-11-01") the API returns.
 *
 * Formatting is driven by the browser locale (when `locale` is omitted) and the
 * sem-schema `format` keyword: `date`, `date-time`, or `time`. Keep this the single
 * source of truth for date display in the grid — do not re-implement at call sites.
 */

/** The sem-schema string formats that identify a date/time column. */
export type DateFormat = 'date' | 'date-time' | 'time'

export function isDateFormat(format?: string): format is DateFormat {
  return format === 'date' || format === 'date-time' || format === 'time'
}

/**
 * Parse an API date value into a Date, treating a bare `YYYY-MM-DD` (no time zone) as a
 * calendar date in the LOCAL zone. `new Date('2026-11-01')` parses as UTC midnight, which
 * shifts to the previous day in negative-offset zones — so a date-only string is parsed
 * via its numeric parts instead to avoid that off-by-one. Values that already carry a time
 * component (date-time) are parsed by the Date constructor as usual.
 */
function parseValue(value: string, format: DateFormat): Date | null {
  if (format === 'time') {
    // Bare "HH:mm[:ss]" — anchor to an arbitrary date so Intl can format the time part.
    const m = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value)
    if (!m) return null
    const d = new Date(2000, 0, 1, Number(m[1]), Number(m[2]), Number(m[3] ?? 0))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface FormatDateOptions {
  /** BCP-47 locale; omit to use the browser/runtime default. */
  locale?: string
}

/**
 * Format a date/time value for display in the grid.
 *   - null / undefined / '' → '' (blank)
 *   - unparseable → the original value stringified (never corrupt unknown data)
 *   - `date` → locale short date; `date-time` → locale short date + time; `time` → locale time
 */
export function formatDateForDisplay(
  value: unknown,
  format: DateFormat,
  opts: FormatDateOptions = {},
): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value !== 'string' && !(value instanceof Date)) return String(value)

  const date = value instanceof Date ? value : parseValue(value, format)
  if (!date) return String(value)

  const { locale } = opts
  const dateStyle: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }
  const timeStyle: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

  const intlOpts: Intl.DateTimeFormatOptions =
    format === 'time'
      ? timeStyle
      : format === 'date-time'
        ? { ...dateStyle, ...timeStyle }
        : dateStyle

  return new Intl.DateTimeFormat(locale, intlOpts).format(date)
}
