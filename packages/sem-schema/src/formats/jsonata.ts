import Ajv from 'ajv';

/**
 * Custom format validation for 'jsonata' format
 * Validates that a string is valid (accepts any string for now)
 * Future: Will add JSONata expression validation
 */
export function validateJsonataFormat(data: string): boolean {
  // For now, accept any string
  // TODO: Add JSONata expression validation in future
  return typeof data === 'string';
}

/**
 * Add 'jsonata' format to AJV instance
 */
export function addJsonataFormat(ajv: Ajv): void {
  ajv.addFormat('jsonata', {
    type: 'string',
    validate: validateJsonataFormat
  });
}
