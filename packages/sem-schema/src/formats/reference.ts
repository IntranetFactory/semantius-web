import Ajv from 'ajv';

/**
 * Custom format validation for 'reference' format
 * Validates that a value is an integer (for foreign key references)
 */
export function validateReferenceFormat(data: any): boolean {
  // Must be a number
  if (typeof data !== 'number') {
    return false;
  }
  
  // Must be an integer (no decimal places)
  return Number.isInteger(data);
}

/**
 * Add 'reference' format to AJV instance
 */
export function addReferenceFormat(ajv: Ajv): void {
  ajv.addFormat('reference', {
    type: 'number',
    validate: validateReferenceFormat
  });
}
