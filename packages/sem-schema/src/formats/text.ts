import Ajv from 'ajv';

/**
 * Custom format validation for 'text' format
 * Text format allows multiline strings
 */
export function validateTextFormat(data: string): boolean {
  // Text format is always valid for strings
  return typeof data === 'string';
}

/**
 * Add 'text' format to AJV instance
 */
export function addTextFormat(ajv: Ajv): void {
  ajv.addFormat('text', {
    type: 'string',
    validate: validateTextFormat
  });
}
