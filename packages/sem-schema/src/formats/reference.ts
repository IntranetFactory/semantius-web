import Ajv from 'ajv';

/**
 * Custom format validation for 'reference' format.
 *
 * The format is a semantic marker that tells the UI to render a reference picker.
 * Actual value-type validation is handled by the schema's `type` keyword:
 *   - type: "integer" for numeric FKs
 *   - type: "string" for UUID/text FKs
 *
 * The format validator always returns true — it does not constrain the value itself.
 */
export function validateReferenceFormat(_data: any): boolean {
  return true;
}

/**
 * Add 'reference' format to AJV instance
 */
export function addReferenceFormat(ajv: Ajv): void {
  ajv.addFormat('reference', validateReferenceFormat);
}
