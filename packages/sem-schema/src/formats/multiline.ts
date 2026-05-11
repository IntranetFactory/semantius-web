import Ajv from 'ajv';

/**
 * Custom format validation for 'multiline' format
 * Multiline format allows multi-line strings (rendered as a textarea in UIs)
 */
export function validateMultilineFormat(data: string): boolean {
  return typeof data === 'string';
}

/**
 * Add 'multiline' format to AJV instance
 */
export function addMultilineFormat(ajv: Ajv): void {
  ajv.addFormat('multiline', {
    type: 'string',
    validate: validateMultilineFormat
  });
}
