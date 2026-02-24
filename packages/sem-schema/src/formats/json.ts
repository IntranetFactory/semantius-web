import Ajv from 'ajv';

/**
 * Custom format validation for 'json' format
 * Validates that a string contains valid parseable JSON
 */
export function validateJsonFormat(data: string): boolean {
  try {
    JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add 'json' format to AJV instance
 */
export function addJsonFormat(ajv: Ajv): void {
  ajv.addFormat('json', {
    type: 'string',
    validate: validateJsonFormat
  });
}
