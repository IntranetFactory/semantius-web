/**
 * Maps API error messages to user-friendly strings.
 * Centralised here so all modules can use consistent error formatting.
 */

function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Format a delete operation error into a user-friendly message.
 * Recognises PostgREST foreign-key constraint violations and produces a readable
 * explanation; falls back to the raw message for other errors.
 *
 * @param error - The Error object thrown by the mutation
 * @param singularLabel - Optional human-readable label for the record being deleted
 *                        (e.g. "Region"). Used as a fallback when the table name
 *                        cannot be resolved from the error message.
 */
export function formatDeleteError(error: Error, singularLabel?: string): string {
  const msg = error.message || ''

  // PostgREST FK violation pattern:
  // "update or delete on table "regions" violates foreign key constraint "customers_region_id_fkey" on table "customers""
  const fkMatch = msg.match(
    /on table "(\w+)" violates foreign key constraint "[^"]+" on table "(\w+)"/,
  )
  if (fkMatch) {
    const sourceLabel = singularLabel || capitalize(singularize(fkMatch[1]))
    const referencedLabel = capitalize(singularize(fkMatch[2]))
    return `${sourceLabel} is still used by a ${referencedLabel}. Cannot delete.`
  }

  return msg || 'An unexpected error occurred. Please try again.'
}
