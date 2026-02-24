import { Input } from '@/components/ui/input'
import type { FormControlProps } from './types'
import { useFormContext } from './FormContext'
import { FormLabel } from './FormLabel'
import { FormDescription } from './FormDescription'
import { FormError } from './FormError'

export function InputIdnEmail({
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
  
  return (
    <form.Field name={name} validators={validators}>
      {(field: any) => (
        <>
          {(hidden || readonly) && <input type="hidden" name={name} value={field.state.value || ''} />}
          {!hidden && (
            <div className="space-y-2">
              <FormLabel htmlFor={name} label={label} required={required} error={!!field.state.meta.errors?.[0]} />
              <Input
                id={name}
                name={readonly ? undefined : name}
                type="email"
                value={field.state.value || ''}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={disabled || readonly}
                placeholder="user@例え.jp"
                aria-invalid={!!field.state.meta.errors?.[0]}
                aria-describedby={field.state.meta.errors?.[0] ? `${name}-error` : undefined}
              />
              <FormDescription description={description} />
              <FormError name={name} error={field.state.meta.errors?.[0]} />
            </div>
          )}
        </>
      )}
    </form.Field>
  )
}
