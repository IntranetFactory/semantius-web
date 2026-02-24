import { useForm } from '@tanstack/react-form'
import { validateData } from 'sem-schema'
import { controls } from './controls'
import { Button } from '@/components/ui/button'
import type { SchemaObject } from 'ajv'
import { InputText } from './InputText'
import { FormProvider } from './FormContext'

export type FormMode = 'edit' | 'create' | 'view'

interface SchemaFormProps {
  schema: SchemaObject
  initialValue?: Record<string, any>
  onSubmit?: (value: Record<string, any>) => void
  formMode?: FormMode
}

/**
 * Generate default values from schema
 */
function generateDefaultValue(schema: SchemaObject): Record<string, any> {
  const defaults: Record<string, any> = {}

  if (schema.properties && typeof schema.properties === 'object') {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (typeof propSchema !== 'object' || propSchema === null) continue

      // Check if default value is provided
      if ('default' in propSchema) {
        defaults[key] = (propSchema as any).default
      } else {
        // Generate default based on type
        const type = (propSchema as any).type || ((propSchema as any).format ? 'string' : undefined)
        
        if (type === 'boolean') {
          defaults[key] = false
        } else if (type === 'number' || type === 'integer') {
          defaults[key] = undefined
        } else if (type === 'string') {
          defaults[key] = ''
        } else if (type === 'array') {
          defaults[key] = []
        } else if (type === 'object') {
          defaults[key] = {}
        }
      }
    }
  }

  return defaults
}

/**
 * Validate a single field value against its schema
 * 
 * @param value - The value to validate
 * @param fieldSchema - The JSON Schema for this specific field
 * @param fieldName - The name of the field being validated
 * @returns Error message if validation fails, undefined if valid
 */
function validateField(value: any, fieldSchema: SchemaObject, fieldName: string): string | undefined {
  // Check if field has inputMode: 'required'
  const inputMode = (fieldSchema as any).inputMode
  const isRequired = inputMode === 'required'
  
  // For required fields, check for empty values
  if (isRequired) {
    if (value === undefined || value === null || value === '') {
      return 'must not be empty'
    }
  }

  // For non-required fields, if value is empty/undefined, skip validation
  // This prevents enum validation errors when no selection is made on optional fields
  if (!isRequired && (value === undefined || value === null || value === '')) {
    return undefined
  }

  // Create a temporary schema for this field within an object
  const tempSchema: SchemaObject = {
    type: 'object',
    properties: {
      [fieldName]: fieldSchema
    },
    // Include required if this field is required at object level
    ...(isRequired ? { required: [fieldName] } : {})
  }

  const tempData = { [fieldName]: value }
  const result = validateData(tempData, tempSchema)

  if (!result.valid && result.errors) {
    // Find the first error for this field
    const fieldError = result.errors.find((err: any) => 
      err.instancePath === `/${fieldName}` || err.instancePath === ''
    )
    return fieldError ? fieldError.message : 'Validation error'
  }

  return undefined
}

export function SchemaForm({ schema, initialValue, onSubmit, formMode = 'edit' }: SchemaFormProps) {
  // Generate initial value if not provided
  const defaultValue = initialValue && Object.keys(initialValue).length > 0
    ? initialValue
    : generateDefaultValue(schema)

  const form = useForm({
    defaultValues: defaultValue,
    onSubmit: async ({ value }) => {
      // Build object with all schema properties for validation
      const cleanedValue: Record<string, any> = {}
      
      // Get all possible fields from schema
      const allFields = schema.properties ? Object.keys(schema.properties) : []
      
      // Include fields based on inputMode:
      // - disabled fields: NEVER submitted (HTML standard behavior)
      // - readonly fields: ALWAYS submitted (they're part of the data)
      // - In create mode: readonly fields are not rendered but still submitted if present in initial value
      for (const key of allFields) {
        const propSchema = (schema.properties as Record<string, SchemaObject>)[key]
        const inputMode = (propSchema as any).inputMode || 'default'
        
        // Disabled fields are NEVER submitted (HTML standard behavior)
        if (inputMode === 'disabled') {
          continue
        }
        
        // In create mode, skip readonly fields (they're not rendered and usually don't exist yet)
        if (formMode === 'create' && inputMode === 'readonly') {
          continue
        }
        
        cleanedValue[key] = value[key]
      }
      
      // DEFENSIVE: This should never happen because view mode has no submit button
      // If we reach here, something is seriously broken in the form rendering logic
      if (formMode === 'view') {
        throw new Error('BUG: Form submitted in view mode, but view mode should have no submit button!')
      }
      
      // Modify schema to exclude fields from required validation based on inputMode and formMode
      let validationSchema = schema
      if (schema.required && Array.isArray(schema.required)) {
        const properties = schema.properties as Record<string, SchemaObject>
        const filteredRequired = schema.required.filter((fieldName: string) => {
          const propSchema = properties[fieldName]
          if (!propSchema) return true
          const inputMode = (propSchema as any).inputMode || 'default'
          
          // Disabled fields are never submitted, so never required
          if (inputMode === 'disabled') return false
          
          // In create mode, readonly fields are not rendered, so not required
          if (formMode === 'create' && inputMode === 'readonly') return false
          
          return true
        })
        validationSchema = { ...schema, required: filteredRequired }
      }
      
      // Validate the entire form
      let result
      try {
        result = validateData(cleanedValue, validationSchema)
      } catch (error) {
        // Schema validation error (invalid schema structure)
        const errorMessage = error instanceof Error ? error.message : 'Invalid schema'
        console.error('Schema validation error:', errorMessage)
        
        // Set a form-level error to display the schema error
        form.setFieldMeta('_schemaError', (prev: any) => ({
          ...prev,
          errors: [errorMessage],
          errorMap: {
            onSubmit: errorMessage,
          }
        }))
        
        return
      }
      
      if (!result.valid) {
        // Log validation failure for debugging
        console.warn('Form validation failed:', result.errors)
        
        // Track errors that couldn't be assigned to fields
        const unhandledErrors: string[] = []
        let firstErrorField: string | null = null
        
        // Set errors on all fields with validation issues
        if (result.errors) {
          result.errors.forEach((error: any) => {
            // Remove leading slash from instancePath to get field name
            const fieldPath = error.instancePath.startsWith('/') 
              ? error.instancePath.substring(1) 
              : error.instancePath
            
            // Check if this field exists in the form
            const fieldExists = fieldPath && schema.properties?.[fieldPath]
            
            if (fieldPath && fieldExists) {
              // Track first field with error for scrolling
              if (!firstErrorField) {
                firstErrorField = fieldPath
              }
              
              form.setFieldMeta(fieldPath, (meta) => ({
                ...meta,
                errors: [error.message],
                errorMap: {
                  ...meta.errorMap,
                  onSubmit: error.message,
                }
              }))
            } else {
              // Error can't be attached to a field - collect for general error display
              const errorMsg = fieldPath 
                ? `${fieldPath}: ${error.message}` 
                : error.message
              unhandledErrors.push(errorMsg)
            }
          })
        }
        
        // If there are unhandled errors, show them in a general validation error banner
        if (unhandledErrors.length > 0) {
          form.setFieldMeta('_validationError', (prev: any) => ({
            ...prev,
            errors: unhandledErrors,
            errorMap: {
              onSubmit: unhandledErrors.join('; '),
            }
          }))
        }
        
        // Scroll to first error field
        if (firstErrorField) {
          // Use setTimeout to allow DOM to update with error messages first
          setTimeout(() => {
            if (firstErrorField) {
              const errorElement = document.getElementById(firstErrorField)
              if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                errorElement.focus({ preventScroll: true })
              }
            }
          }, 100)
        }
        
        // Do not call onSubmit callback when validation fails
        return
      }
      
      // Clear any previous general validation errors on successful validation
      form.setFieldMeta('_validationError', (prev: any) => ({
        ...prev,
        errors: [],
        errorMap: {}
      }))
      
      // Clear field-level errors on successful validation
      for (const key of allFields) {
        form.setFieldMeta(key, (meta) => ({
          ...meta,
          errors: [],
          errorMap: {}
        }))
      }
      
      // Only call onSubmit when validation passes (with cleaned data)
      onSubmit?.(cleanedValue)
    },
  })

  if (!schema.properties || typeof schema.properties !== 'object') {
    return <div>Invalid schema: no properties defined</div>
  }

  const properties = schema.properties as Record<string, SchemaObject>

  // Create context value for form controls - includes form instance
  const formContextValue = {
    form,
    schema,
    validateField: (value: any, fieldName: string) => {
      const fieldSchema = properties[fieldName]
      if (!fieldSchema) return undefined
      return validateField(value, fieldSchema, fieldName)
    },
  }

  return (
    <FormProvider value={formContextValue}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
          
          // After validation, scroll to first error field if any
          // Use setTimeout to ensure validation has completed and DOM has updated
          setTimeout(() => {
            // Get all fields from schema
            const allFields = schema.properties ? Object.keys(schema.properties) : []
            
            // Find first field with error
            for (const fieldName of allFields) {
              const fieldMeta = form.getFieldMeta(fieldName)
              if (fieldMeta?.errors && fieldMeta.errors.length > 0) {
                const errorElement = document.getElementById(fieldName)
                if (errorElement) {
                  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  errorElement.focus({ preventScroll: true })
                }
                break
              }
            }
          }, 100)
        }}
        className="space-y-6"
      >
      {/* Display schema validation errors */}
      <form.Subscribe selector={(state) => [state.fieldMeta._schemaError?.errors]}>
        {([schemaErrors]) => {
          if (!schemaErrors || schemaErrors.length === 0) return null
          return (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Schema Validation Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {schemaErrors[0]}
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      </form.Subscribe>
      
      {/* Display general validation errors */}
      <form.Subscribe selector={(state) => [state.fieldMeta._validationError?.errors]}>
        {([validationErrors]) => {
          if (!validationErrors || validationErrors.length === 0) return null
          return (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      </form.Subscribe>
      
      {Object.entries(properties).map(([key, propSchema]) => {
        if (typeof propSchema !== 'object') return null

        const type = propSchema.type
        const format = propSchema.format
        const hasEnum = 'enum' in propSchema && Array.isArray((propSchema as any).enum)
        const label = propSchema.title || key
        const description = propSchema.description

        // Get inputMode from schema (defaults to 'default' if not specified)
        let inputMode: 'default' | 'required' | 'readonly' | 'disabled' | 'hidden' = 
          (propSchema as any).inputMode || 'default'
        
        // In create mode, skip fields with inputMode='readonly' or 'disabled'
        if (formMode === 'create' && (inputMode === 'readonly' || inputMode === 'disabled')) {
          return null
        }
        
        // Form-level view mode overrides schema-level inputMode (except for hidden)
        if (formMode === 'view' && inputMode !== 'hidden') {
          inputMode = 'readonly'
        }

        // Use format if available, otherwise check for enum, otherwise use type as format
        const controlKey = format || (hasEnum ? 'enum' : type) as string
        const ControlComponent = controls[controlKey] || InputText

        // Skip validation for readonly, disabled, and hidden fields
        const shouldValidate = inputMode === 'default' || inputMode === 'required'

        return (
          <ControlComponent
            key={key}
            name={key}
            label={label}
            description={description}
            inputMode={inputMode}
            validators={shouldValidate ? {
              // Only validate on submit, not on blur
              // This prevents blur validation from canceling submit button clicks
              onSubmit: ({ value }) => validateField(value, propSchema, key),
            } : undefined}
          />
        )
      })}

      {formMode !== 'view' && (
        <div className="flex gap-4">
          <Button type="submit">Submit</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
        </div>
      )}
    </form>
    </FormProvider>
  )
}
