/**
 * Format validators for SemSchema
 * 
 * Includes:
 * 1. Custom SemSchema formats (not in JSON Schema spec): json, html, text, code, jsonata, reference
 * 2. Standard JSON Schema formats missing from ajv-formats: iri, iri-reference, idn-email, idn-hostname
 */
import Ajv from 'ajv';
import { addJsonFormat } from './json';
import { addHtmlFormat } from './html';
import { addTextFormat } from './text';
import { addCodeFormat } from './code';
import { addJsonataFormat } from './jsonata';
import { addReferenceFormat } from './reference';
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

/**
 * Add all format validators to AJV instance
 * - Custom formats: json, html, text, code, jsonata, reference
 * - Standard formats missing from ajv-formats: iri, iri-reference, idn-email, idn-hostname
 */
export function addAllFormats(ajv: Ajv): void {
  // Custom SemSchema formats
  addJsonFormat(ajv);
  addHtmlFormat(ajv);
  addTextFormat(ajv);
  addCodeFormat(ajv);
  addJsonataFormat(ajv);
  addReferenceFormat(ajv);
  // Standard JSON Schema formats (missing from ajv-formats)
  ajv.addFormat('iri', iriFormat);
  ajv.addFormat('iri-reference', iriReferenceFormat);
  ajv.addFormat('idn-email', idnEmailFormat);
  ajv.addFormat('idn-hostname', idnHostnameFormat);
}
