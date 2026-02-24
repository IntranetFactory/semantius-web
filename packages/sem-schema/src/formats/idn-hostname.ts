/**
 * IDN Hostname (Internationalized Domain Name Hostname) format validator
 * 
 * This is a STANDARD JSON Schema format (Draft 2019-09+) that is missing from ajv-formats.
 * Like hostname but allows Unicode characters.
 * 
 * Note: This is a basic validator - more permissive to allow international characters.
 */
export const idnHostnameFormat = {
  validate: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    if (value.length === 0 || value.length > 253) return false;
    
    // Cannot start or end with dot or hyphen
    if (value.startsWith('.') || value.endsWith('.')) return false;
    if (value.startsWith('-') || value.endsWith('-')) return false;
    
    // Split into labels (parts between dots)
    const labels = value.split('.');
    
    for (const label of labels) {
      // Each label must be 1-63 characters
      if (label.length === 0 || label.length > 63) return false;
      
      // Labels cannot start or end with hyphen
      if (label.startsWith('-') || label.endsWith('-')) return false;
    }
    
    return true;
  }
};
