import { lazy, Suspense } from 'react'
import type { FormControlProps } from './types'
import { useFormContext } from './FormContext'
import { FormLabel } from './FormLabel'
import { FormDescription } from './FormDescription'
import { FormError } from './FormError'

// Lazy load CodeMirror
const CodeMirrorEditor = lazy(() => import('./CodeMirrorJson'))

export function InputJson({
  name,
  label,
  description,
  inputMode = 'default',
  validators,
}: FormControlProps) {
  const { form } = useFormContext()
  
  // Derive props from inputMode
  const required = inputMode === 'required'
  const readonly = inputMode === 'readonly'
  const disabled = inputMode === 'disabled'
  const hidden = inputMode === 'hidden'
  
  if (hidden) {
    // Hidden fields should render as <input type="hidden"> to be included in form submission
    return (
      <form.Field name={name} validators={validators}>
        {(field: any) => {
          const stringValue = typeof field.state.value === 'string' 
            ? field.state.value 
            : field.state.value 
              ? JSON.stringify(field.state.value) 
              : ''
          return <input type="hidden" name={name} value={stringValue} />
        }}
      </form.Field>
    )
  }
  
  return (
    <form.Field name={name} validators={validators}>
      {(field: any) => {
        // Ensure value is a string (prettify if it's an object)
        const stringValue = typeof field.state.value === 'string' 
          ? field.state.value 
          : field.state.value 
            ? JSON.stringify(field.state.value, null, 2) 
            : ''

        return (
          <div className="space-y-2">
            <FormLabel htmlFor={name} label={label} required={required} error={!!field.state.meta.errors?.[0]} />
            <div className={`border rounded-md overflow-hidden ${field.state.meta.errors?.[0] ? 'border-destructive' : 'border-input'}`}>
              <Suspense fallback={<div className="p-4 text-muted-foreground">Loading editor...</div>}>
                <CodeMirrorEditor
                  value={stringValue}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  disabled={disabled || readonly}
                />
              </Suspense>
            </div>
            <FormDescription description={description} />
            <FormError name={name} error={field.state.meta.errors?.[0]} />
          </div>
        )
      }}
    </form.Field>
  )
}
