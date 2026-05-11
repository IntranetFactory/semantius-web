import Ajv from 'ajv';

/**
 * Custom format validation for 'text' format
 * Text format is a single-line string (UI hint — same constraints as a plain string)
 */
export function validateTextFormat(data: string): boolean {
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
