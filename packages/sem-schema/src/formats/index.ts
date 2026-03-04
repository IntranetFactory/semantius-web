/**
 * Format validators for SemSchema
 * 
 * Includes:
 * 1. Custom SemSchema formats (not in JSON Schema spec): json, html, text, code, jsonata, reference, parent
 * 2. Standard JSON Schema formats missing from ajv-formats: iri, iri-reference, idn-email, idn-hostname
 * 3. Overrides for standard formats: date-time (extended to accept ISO 8601 without timezone)
 */
import Ajv from 'ajv';
import { addJsonFormat } from './json';
import { addHtmlFormat } from './html';
import { addTextFormat } from './text';
import { addCodeFormat } from './code';
import { addJsonataFormat } from './jsonata';
import { addReferenceFormat, validateReferenceFormat } from './reference';
import { iriFormat } from './iri';
import { iriReferenceFormat } from './iri-reference';
import { idnEmailFormat } from './idn-email';
import { idnHostnameFormat } from './idn-hostname';

export { validateJsonFormat, addJsonFormat } from './json';
export { validateHtmlFormat, addHtmlFormat } from './html';
export { validateTextFormat, addTextFormat } from './text';
export { validateCodeFormat, addCodeFormat } from './code';
export { validateJsonataFormat, addJsonataFormat } from './jsonata';
export { validateReferenceFormat, addReferenceFormat } from './reference';
export { iriFormat } from './iri';
export { iriReferenceFormat } from './iri-reference';
export { idnEmailFormat } from './idn-email';
export { idnHostnameFormat } from './idn-hostname';

// Used by isValidDate to check day counts per month
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DATE_RE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Validates the date portion (YYYY-MM-DD) strictly.
 * Date() must NOT be used here: it silently rolls impossible dates
 * (e.g. Feb 30 → March 2) instead of rejecting them.
 */
function isValidDate(str: string): boolean {
  const m = DATE_RE.exec(str);
  if (!m) return false;
  const month = +m[2];
  const day = +m[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(+m[1]) ? 29 : DAYS[month]);
}

/**
 * Validates a date-time string using a hybrid approach:
 *
 * 1. The date part (YYYY-MM-DD) is validated with a strict range check to
 *    catch impossible calendar dates (e.g. Feb 30) that Date() would silently
 *    roll over to the next valid date instead of rejecting.
 *
 * 2. The full string is then parsed with Date() which correctly rejects invalid
 *    timezone offsets (e.g. +25:00, +00:61) and malformed time components
 *    without needing a hand-rolled time regex.
 *
 * Accepts both RFC 3339 (with timezone) and ISO 8601 without timezone
 * (e.g. Python's datetime.isoformat() output).
 */
function isValidDateTime(str: string): boolean {
  const tIdx = str.search(/t/i);
  if (tIdx === -1) return false;

  // Date part must be strictly valid — Date() alone is insufficient here
  if (!isValidDate(str.slice(0, tIdx))) return false;

  // Validate time + optional timezone via Date().
  // For timezone-less strings append 'Z' (UTC) so Date() can parse them.
  const hasTimezone = /[zZ]$|[+-]\d\d:?\d\d$/.test(str);
  const d = new Date(hasTimezone ? str : str + 'Z');
  return !isNaN(d.getTime());
}

/**
 * Add all format validators to AJV instance
 * - Custom formats: json, html, text, code, jsonata, reference, parent
 * - Standard formats missing from ajv-formats: iri, iri-reference, idn-email, idn-hostname
 * - Overrides: date-time (extended to accept ISO 8601 without timezone)
 */
export function addAllFormats(ajv: Ajv): void {
  // Custom SemSchema formats
  addJsonFormat(ajv);
  addHtmlFormat(ajv);
  addTextFormat(ajv);
  addCodeFormat(ajv);
  addJsonataFormat(ajv);
  addReferenceFormat(ajv);
  // 'parent' behaves identically to 'reference' (FK generating a DB relationship)
  ajv.addFormat('parent', validateReferenceFormat);
  // Standard JSON Schema formats (missing from ajv-formats)
  ajv.addFormat('iri', iriFormat);
  ajv.addFormat('iri-reference', iriReferenceFormat);
  ajv.addFormat('idn-email', idnEmailFormat);
  ajv.addFormat('idn-hostname', idnHostnameFormat);
  // Override date-time to accept ISO 8601 without timezone (e.g. Python isoformat)
  ajv.addFormat('date-time', isValidDateTime);
}
