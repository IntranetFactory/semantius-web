/**
 * Custom keywords for sem-schema vocabulary
 */
import Ajv from 'ajv';
import { addPrecisionKeyword } from './precision';

export { addPrecisionKeyword } from './precision';

/**
 * Add all custom keywords to AJV instance
 */
export function addAllKeywords(ajv: Ajv): void {
  addPrecisionKeyword(ajv);
}
