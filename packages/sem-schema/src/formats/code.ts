import Ajv from 'ajv';

/**
 * Custom format validation for 'code' format
 * Validates that a string is valid (accepts any string for now)
 * Future: May add code-specific validation
 */
export function validateCodeFormat(data: string): boolean {
  // For now, accept any string
  return typeof data === 'string';
}

/**
 * Add 'code' format to AJV instance
 */
export function addCodeFormat(ajv: Ajv): void {
  ajv.addFormat('code', {
    type: 'string',
    validate: validateCodeFormat
  });
}
