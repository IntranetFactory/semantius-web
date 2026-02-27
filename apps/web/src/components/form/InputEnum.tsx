import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FormControlProps } from './types'
import { useFormContext } from './FormContext'
import { FormLabel } from './FormLabel'
import { FormDescription } from './FormDescription'
import { FormError } from './FormError'

interface EnumFieldInnerProps {
  field: any
  name: string
  label?: string
  description?: string
  required: boolean
  disabled: boolean
  readonly: boolean
  hidden: boolean
  enumValues: string[]
  form: any
  validators?: any
}

function EnumFieldInner({
  field,
  name,
  label,
  description,
  required,
  disabled,
  readonly,
  hidden,
  enumValues,
  form,
  validators,
}: EnumFieldInnerProps) {
  if (hidden) {
    // Hidden fields should render as <input type="hidden"> to be included in form submission
    return (
      <form.Field name={name} validators={validators}>
        {(field: any) => (
          <input type="hidden" name={name} value={field.state.value || ''} />
        )}
      </form.Field>
    )
  }
  
  // Get the actual value - prefer field.state.value, fallback to empty string
  const currentValue = field.state.value ?? ''
  
  // Only pass valid enum values to Select, otherwise undefined for placeholder
  const selectValue = currentValue && enumValues.includes(currentValue) ? currentValue : undefined
  
  return (
    <div className="pt-2 space-y-1">
      <FormLabel htmlFor={name} label={label} required={required} error={!!field.state.meta.errors?.[0]} />
      <Select
        // Key prop forces re-render when value changes - required for Radix UI Select with tanstack-form
        // See: https://stackoverflow.com/a/78746413
        key={`${name}-${currentValue}`}
        value={selectValue}
        onValueChange={(value) => {
          // Clear errors first, then change value
          // This ensures that selecting a valid value always clears validation errors
          field.setMeta((meta: any) => ({
            ...meta,
            errors: [],
            errorMap: {},
          }))
          field.handleChange(value)
        }}
        disabled={disabled || readonly}
      >
        <SelectTrigger
          id={name}
          tabIndex={readonly ? -1 : undefined}
          className={readonly ? 'opacity-60' : ''}
          aria-invalid={!!field.state.meta.errors?.[0]}
          aria-describedby={field.state.meta.errors?.[0] ? `${name}-error` : undefined}
          onBlur={() => field.handleBlur()}
        >
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {enumValues.map((value: string) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription description={description} error={field.state.meta.errors?.[0]} />
      <FormError name={name} error={field.state.meta.errors?.[0]} />
    </div>
  )
}

export function InputEnum({
  name,
  label,
  description,
  inputMode = 'default',
  validators,
  schema,
}: FormControlProps) {
  const { form } = useFormContext()

  // Derive props from inputMode
  const required = inputMode === 'required'
  const readonly = inputMode === 'readonly'
  const disabled = inputMode === 'disabled'
  const hidden = inputMode === 'hidden'

  // Get enum values from schema prop
  const enumValues = (schema as any)?.enum || []
  
  return (
    <form.Field 
      name={name}
      // Note: defaultValue is handled by the form's defaultValues from useForm
      // Do not set defaultValue here as it can cause issues with Radix UI Select
      validators={validators}
    >
      {(field: any) => (
        <EnumFieldInner
          field={field}
          name={name}
          label={label}
          description={description}
          required={required}
          disabled={disabled}
          readonly={readonly}
          hidden={hidden}
          enumValues={enumValues}
          form={form}
          validators={validators}
        />
      )}
    </form.Field>
  )
}
