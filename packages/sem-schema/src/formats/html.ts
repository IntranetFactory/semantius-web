import Ajv from 'ajv';

/**
 * Custom format validation for 'html' format
 * Validates that a string contains HTML markup (checks for HTML tags)
 */
export function validateHtmlFormat(data: string): boolean {
  // Basic check for HTML tags
  return /<[a-z][\s\S]*>/i.test(data);
}

/**
 * Add 'html' format to AJV instance
 */
export function addHtmlFormat(ajv: Ajv): void {
  ajv.addFormat('html', {
    type: 'string',
    validate: validateHtmlFormat
  });
}
