# Form Components

This directory contains form components for rendering dynamic forms based on JSON Schema with validation powered by the sem-schema package.

## Overview

The form engine consists of:
1. **Form Controls** - Individual input components for each data type and format
2. **SchemaForm** - Main component that renders a complete form from a JSON Schema and provides form context
3. **FormContext** - React Context for accessing schema and validation within form controls
4. **FormControlProps** - Shared interface for all form controls

## Form Controls

Each form control provides a consistent interface defined in `types.ts`:

### Design Principle

**IMPORTANT**: All form controls MUST use [shadcn/ui](https://ui.shadcn.com/) components whenever possible for consistent styling, accessibility, and maintainability. Do not create custom implementations when shadcn provides the component.

### Available Controls

- **TextInput** - Basic text input (default for string type) - uses shadcn Input
- **EmailInput** - Email input with validation (format: "email") - uses shadcn Input
- **NumberInput** - Number/integer input with proper type handling - uses shadcn Input
- **TextareaInput** - Multi-line text input (format: "text") - uses shadcn Textarea
- **CheckboxInput** - Boolean checkbox input - uses shadcn Checkbox
- **DateInput** - Date picker with calendar UI (format: "date") - uses shadcn DatePicker
- **DateTimeInput** - Date and time picker (format: "date-time") - uses shadcn-based DateTimePicker
- **HtmlEditor** - CodeMirror editor with HTML syntax highlighting (format: "html")
- **JsonEditor** - CodeMirror editor with JSON syntax highlighting (format: "json")

### Common Props

All form controls accept the following props:

```typescript
interface FormControlProps {
  name: string           // Field name
  label?: string         // Display label
  description?: string   // Help text
  value: any            // Current value
  error?: string        // Validation error message
  required?: boolean    // Whether field is required
  disabled?: boolean    // Whether field is disabled
  onChange: (value: any) => void  // Value change handler
  onBlur?: () => void   // Blur event handler
}
```

### Form Context

All form controls **must** be used within a `SchemaForm` component. They access the form context to:
- Validate that they're properly nested
- Access the full schema for validation purposes

```typescript
// Inside each form control
const formContext = useFormContext() // Throws error if not in SchemaForm
```

This ensures form controls are always used in the correct context with TanStack Form.

## SchemaForm Component

The `SchemaForm` component automatically renders a form based on a JSON Schema.

### Usage

```tsx
import { SchemaForm } from '@/components/form'

function MyComponent() {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', required: true },
      email: { type: 'string', format: 'email' },
      age: { type: 'integer' }
    },
    required: ['name', 'email']
  }

  const handleSubmit = (value) => {
    console.log('Form submitted:', value)
  }

  return (
    <SchemaForm 
      schema={schema} 
      onSubmit={handleSubmit} 
    />
  )
}
```

### Features

- **Automatic Field Rendering** - Selects appropriate control based on type and format
- **Field-Level Validation** - Validates on blur using AJV and sem-schema
- **Form-Level Validation** - Validates all fields on submit
- **Default Values** - Generates defaults from schema or uses provided initial values
- **Error Display** - Shows validation errors below each field
- **Required Fields** - Marks required fields with asterisk

### Field Type Mapping

The SchemaForm automatically maps schema types/formats to appropriate shadcn-based controls:

| Type/Format | Control | shadcn Component |
|------------|---------|------------------|
| type: "boolean" | CheckboxInput | Checkbox |
| type: "integer" or "number" | NumberInput | Input (type="number") |
| format: "json" | JsonEditor | CodeMirror |
| format: "html" | HtmlEditor | CodeMirror |
| format: "text" | TextareaInput | Textarea |
| format: "email" | EmailInput | Input (type="email") |
| format: "date" | DateInput | DatePicker (Calendar + Popover) |
| format: "date-time" | DateTimeInput | DateTimePicker (Calendar + Time inputs + Popover) |
| default (type: "string") | TextInput | Input |

## Validation

### Field-Level (onBlur)

Each field validates when it loses focus:

```typescript
validators={{
  onBlur: ({ value }) => validateField(value, propSchema, key, schema)
}}
```

### Form-Level (onSubmit)

The entire form validates on submit:

```typescript
const result = validateData(value, schema)
if (result.valid) {
  onSubmit?.(value)
} else {
  // Display errors on each field
}
```

## Form Viewer Route

The `/form-viewer` route demonstrates the form engine:

```
http://localhost:5173/form-viewer?schema=http://localhost:5173/schemas/person.schema.json
```

This route:
1. Fetches the schema from the provided URL
2. Renders the SchemaForm
3. Validates form on submit
4. Displays submitted data (does not actually submit)

## Examples

See the form viewer at `/form-viewer` with various schema URLs:

- Person Schema: `?schema=http://localhost:5173/schemas/person.schema.json`
- Product Schema: `?schema=http://localhost:5173/schemas/product.schema.json`
- Blog Post Schema: `?schema=http://localhost:5173/schemas/blogpost.schema.json`

## Adding New Form Controls

To add a new form control, you only need to update the `controls.ts` file:

1. Create a new file in this directory (e.g., `URLInput.tsx`)
2. **IMPORTANT**: Use shadcn/ui components - check https://ui.shadcn.com/docs/components first
3. Implement the `FormControlProps` interface
4. Open `controls.ts` and make two changes:
   - Add the import: `import { URLInput } from './URLInput'`
   - Add to the controls map: `controls: { url: URLInput }`

The `SchemaForm` component will automatically use your control for fields with that format or type.

**Note**: When a schema property has no `format` defined, its `type` is used as the format key.

### Example: Adding a URL Input

```typescript
// 1. Create URLInput.tsx using shadcn Input component
import { Input } from '@/components/ui/input'
import type { FormControlProps } from './types'
import { useFormContext } from './FormContext'
import { FormLabel } from './FormLabel'
import { FormDescription } from './FormDescription'
import { FormError } from './FormError'

export function URLInput(props: FormControlProps) {
  const { form } = useFormContext()
  
  return (
    <form.Field name={props.name} validators={props.validators}>
      {(field: any) => (
        <div className="space-y-2">
          <FormLabel htmlFor={props.name} label={props.label} required={props.required} />
          <Input
            id={props.name}
            type="url"
            value={field.state.value || ''}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            disabled={props.disabled}
          />
          <FormDescription description={props.description} />
          <FormError name={props.name} error={field.state.meta.errors?.[0]} />
        </div>
      )}
    </form.Field>
  )
}

// 2. Update controls.ts
import { URLInput } from './URLInput'

export const controls = {
  // ... existing controls
  url: URLInput,  // Add this line
}
```

That's it! The form engine will now use `URLInput` for any field with `format: "url"`.
