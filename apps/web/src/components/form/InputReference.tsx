import type { FormControlProps } from './types'
import { useFormContext } from './FormContext'
import { FormLabel } from './FormLabel'
import { FormDescription } from './FormDescription'
import { FormError } from './FormError'
import { APISelect } from './api-select'

export function InputReference({
  name,
  label,
  description,
  inputMode = 'default',
  validators,
  schema,
}: FormControlProps) {
  const { form } = useFormContext()

  console.log('InputReference schema', name, schema)

  // Derive props from inputMode
  const required = inputMode === 'required'
  const readonly = inputMode === 'readonly'
  const disabled = inputMode === 'disabled'
  const hidden = inputMode === 'hidden'

  // Get reference-specific config from schema prop
  const fieldType = (schema as any)?.type
  const searchUrl = (schema as any)?.searchUrl
  const idUrl = (schema as any)?.idUrl
  const getRecords = (schema as any)?.getRecords
  const getRecordId = (schema as any)?.getRecordId ?? '${id}'
  const renderItem = (schema as any)?.renderItem ?? '${label}'
  const placeholder = (schema as any)?.placeholder || (label ? `Search ${label.toLowerCase()}...` : 'Search...')

  // Convert the numeric form value to a string for APISelect, and back on change
  const isNumeric = fieldType === 'integer' || fieldType === 'number'

  function toSelectValue(formValue: any): string {
    if (formValue === undefined || formValue === null || formValue === '') return ''
    return String(formValue)
  }

  function toFormValue(selectValue: string): any {
    // Use null (not undefined) so TanStack Form stores an explicit empty value for numeric
    // fields rather than coercing undefined to 0, and so the required validator can detect it
    if (selectValue === '') return null
    if (isNumeric) {
      const n = Number(selectValue)
      return isNaN(n) ? null : n
    }
    return selectValue
  }

  return (
    <form.Field name={name} validators={validators}>
      {(field: any) => (
        <>
          {(hidden || readonly) && <input type="hidden" name={name} value={field.state.value ?? ''} />}
          {!hidden && (
            <div className="pt-2 space-y-1">
              <FormLabel htmlFor={name} label={label} required={required} error={!!field.state.meta.errors?.[0]} />
              <APISelect
                searchUrl={searchUrl}
                idUrl={idUrl}
                getRecords={getRecords}
                getRecordId={getRecordId}
                renderItem={renderItem}
                label={label ?? name}
                placeholder={placeholder}
                value={toSelectValue(field.state.value)}
                onChange={(value) => field.handleChange(toFormValue(value))}
                disabled={disabled || readonly}
                clearable={true}
                width="100%"
              />
              <FormDescription description={description} error={field.state.meta.errors?.[0]} />
              <FormError name={name} error={field.state.meta.errors?.[0]} />
            </div>
          )}
        </>
      )}
    </form.Field>
  )
}
