import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { InputDate } from '../InputDate'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputDate', () => {
  function TestWrapper({ 
    children, 
    defaultValue,
    inputMode = 'default'
  }: { 
    children: React.ReactNode
    defaultValue?: string
    inputMode?: string
  }) {
    const form = useForm({
      defaultValues: { date: defaultValue || '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          date: { type: 'string', format: 'date', inputMode }
        },
        required: inputMode === 'required' ? ['date'] : []
      },
      validateField: (value: any) => {
        if (inputMode === 'required' && !value) {
          return 'must not be empty'
        }
        return undefined
      },
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render date picker button and input', () => {
    const { container } = render(
      <TestWrapper>
        <InputDate name="date" />
      </TestWrapper>
    )
    const button = container.querySelector('button')
    expect(button).toBeTruthy()
    const input = screen.getByPlaceholderText('Pick a date')
    expect(input).toBeInTheDocument()
  })

  it('should show required indicator when field is required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputDate name="date" label="Date" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should support validation via validators prop', () => {
    render(
      <TestWrapper inputMode="required">
        <InputDate name="date" 
          label="Date"inputMode="required" validators={{
            onBlur: () => 'must not be empty'
          }}
        />
      </TestWrapper>
    )
    // Test that the component accepts validators prop without error
    const input = screen.getByPlaceholderText('Pick a date')
    expect(input).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should display label and description', () => {
    render(
      <TestWrapper>
        <InputDate 
          name="date" 
          label="Birth Date" 
          description="Select your birth date"
        />
      </TestWrapper>
    )
    expect(screen.getByText('Birth Date')).toBeInTheDocument()
    expect(screen.getByText('Select your birth date')).toBeInTheDocument()
  })

  it('should handle default value', () => {
    render(
      <TestWrapper defaultValue="2024-01-15">
        <InputDate name="date" />
      </TestWrapper>
    )
    // Date should be formatted and displayed in the input field
    const input = screen.getByDisplayValue(/Jan/)
    expect(input).toBeInTheDocument()
  })
})
