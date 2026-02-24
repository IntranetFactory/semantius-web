/**
 * IRI (Internationalized Resource Identifier) format validator
 * 
 * This is a STANDARD JSON Schema format (Draft 2019-09+) that is missing from ajv-formats.
 * IRI is like URI but allows Unicode characters.
 * 
 * Note: This is a basic validator - more permissive than strict IRI spec.
 */
export const iriFormat = {
  validate: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    if (value.length === 0) return false;
    
    // Basic check: must have a scheme (protocol)
    // IRI allows Unicode, so we're more permissive than URI
    const iriPattern = /^[a-z][a-z0-9+.-]*:/i;
    return iriPattern.test(value);
  }
};
