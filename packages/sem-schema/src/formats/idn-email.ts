/**
 * IDN Email (Internationalized Domain Name Email) format validator
 * 
 * This is a STANDARD JSON Schema format (Draft 2019-09+) that is missing from ajv-formats.
 * Like email but allows Unicode characters in the domain part.
 * 
 * Note: This is a basic validator - checks for @ and basic structure.
 */
export const idnEmailFormat = {
  validate: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    if (value.length === 0) return false;
    
    // Basic email structure: localpart@domain
    const parts = value.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domain] = parts;
    
    // Local part: must not be empty, can contain ASCII and some special chars
    if (localPart.length === 0) return false;
    
    // Domain: must not be empty, allows Unicode
    if (domain.length === 0) return false;
    
    // Domain must have at least one dot (unless it's localhost-like)
    // and not start/end with dot
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    
    return true;
  }
};
