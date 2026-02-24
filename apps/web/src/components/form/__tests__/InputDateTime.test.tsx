import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { InputDateTime } from '../InputDateTime'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputDateTime', () => {
  function TestWrapper({ 
    children, 
    inputMode = 'default' 
  }: { 
    children: React.ReactNode
    inputMode?: string
  }) {
    const form = useForm({
      defaultValues: { datetime: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          datetime: { type: 'string', format: 'date-time', inputMode }
        },
        required: inputMode === 'required' ? ['datetime'] : []
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

  it('should render date button and time input', () => {
    const { container } = render(
      <TestWrapper>
        <InputDateTime name="datetime" />
      </TestWrapper>
    )
    const button = container.querySelector('button')
    const timeInput = container.querySelector('input[type="time"]')
    expect(button).toBeTruthy()
    expect(timeInput).toBeTruthy()
  })

  it('should have proper styling with border', () => {
    const { container } = render(
      <TestWrapper>
        <InputDateTime name="datetime" />
      </TestWrapper>
    )
    const button = container.querySelector('button')
    const timeInput = container.querySelector('input[type="time"]')
    expect(button?.className).toContain('border')
    expect(timeInput?.className).toContain('border')
  })

  it('should show required indicator when field is required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputDateTime name="datetime" label="DateTime" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should support validation via validators prop', () => {
    const { container } = render(
      <TestWrapper inputMode="required">
        <InputDateTime name="datetime" 
          label="DateTime"inputMode="required" validators={{
            onBlur: () => 'must not be empty',
            onSubmit: () => 'must not be empty'
          }}
        />
      </TestWrapper>
    )
    // Test that the component accepts validators prop without error
    const button = container.querySelector('button')
    const timeInput = container.querySelector('input[type="time"]')
    expect(button).toBeTruthy()
    expect(timeInput).toBeTruthy()
  })

  it('should display label and description', () => {
    render(
      <TestWrapper>
        <InputDateTime 
          name="datetime" 
          label="Event Time" 
          description="Select the event date and time"
        />
      </TestWrapper>
    )
    expect(screen.getByText('Event Time')).toBeInTheDocument()
    expect(screen.getByText('Select the event date and time')).toBeInTheDocument()
  })
})
