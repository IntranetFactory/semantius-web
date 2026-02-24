/**
 * IRI Reference format validator
 * 
 * This is a STANDARD JSON Schema format (Draft 2019-09+) that is missing from ajv-formats.
 * IRI Reference can be an absolute IRI or a relative reference.
 * 
 * Note: This is a basic validator - accepts most strings that look like references.
 */
export const iriReferenceFormat = {
  validate: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    
    // IRI reference can be:
    // - Absolute IRI (with scheme)
    // - Relative reference (starting with /, ./, ../, or just a path)
    // - Fragment only (#something)
    // - Query only (?something)
    
    // For simplicity, we accept any non-empty string that doesn't contain
    // invalid characters (spaces, <, >, etc.)
    const invalidChars = /[\s<>{}|\\^`]/;
    return value.length > 0 && !invalidChars.test(value);
  }
};
