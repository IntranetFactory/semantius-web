import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { InputText } from '../InputText'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputText', () => {
  function TestWrapper({ children, defaultValue }: { children: React.ReactNode, defaultValue?: string }) {
    const form = useForm({
      defaultValues: { testField: defaultValue || '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { type: 'object', properties: {} },
      validateField: () => undefined,
    }

    return (
      <FormProvider value={mockContext}>
        {children}
      </FormProvider>
    )
  }

  it('should render with label', () => {
    render(
      <TestWrapper>
        <InputText name="testField" label="Username" />
      </TestWrapper>
    )
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('should show required indicator', () => {
    render(
      <TestWrapper>
        <InputText name="testField" label="Username" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should display description', () => {
    render(
      <TestWrapper>
        <InputText name="testField" description="Enter your username" />
      </TestWrapper>
    )
    expect(screen.getByText('Enter your username')).toBeInTheDocument()
  })

  it('should execute validator and show error', async () => {
    const { container } = render(
      <TestWrapper>
        <InputText 
          name="testField" 
          label="Username"
          validators={{
            onBlur: ({ value }) => value ? undefined : 'This field is required'
          }}
        />
      </TestWrapper>
    )
    
    const input = container.querySelector('input')
    
    // Trigger blur to run validation
    input?.focus()
    input?.blur()
    
    // Wait for validation
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.queryByText('This field is required')).toBeInTheDocument()
  })

  it('should handle default value', () => {
    const { container } = render(
      <TestWrapper defaultValue="default text">
        <InputText name="testField" />
      </TestWrapper>
    )
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('default text')
  })
})
