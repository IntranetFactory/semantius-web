import Ajv from 'ajv';

/**
 * Custom format validation for 'parent' format
 * Validates that a value is an integer (for parent record references)
 */
export function validateParentFormat(data: any): boolean {
  // Must be a number
  if (typeof data !== 'number') {
    return false;
  }
  
  // Must be an integer (no decimal places)
  return Number.isInteger(data);
}

/**
 * Add 'parent' format to AJV instance
 */
export function addParentFormat(ajv: Ajv): void {
  ajv.addFormat('parent', {
    type: 'number',
    validate: validateParentFormat
  });
}
