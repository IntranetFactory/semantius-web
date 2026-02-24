import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputDuration } from '../InputDuration'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputDuration', () => {
  function TestWrapper({ 
    children, 
    inputMode = 'default' 
  }: { 
    children: React.ReactNode
    inputMode?: string
  }) {
    const form = useForm({
      defaultValues: { duration: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          duration: { type: 'string', format: 'duration', inputMode }
        },
        required: inputMode === 'required' ? ['duration'] : []
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

  it('should render duration input with text type', () => {
    const { container } = render(
      <TestWrapper>
        <InputDuration name="duration" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should have placeholder text', () => {
    render(
      <TestWrapper>
        <InputDuration name="duration" />
      </TestWrapper>
    )
    const input = screen.getByPlaceholderText('P3Y6M4DT12H30M5S')
    expect(input).toBeInTheDocument()
  })

  it('should show required indicator when field is required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputDuration name="duration" label="Duration" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should support validation via validators prop', () => {
    render(
      <TestWrapper inputMode="required">
        <InputDuration name="duration" 
          label="Duration"inputMode="required" validators={{
            onBlur: () => 'must not be empty',
            onSubmit: () => 'must not be empty'
          }}
        />
      </TestWrapper>
    )
    // Test that the component accepts validators prop without error
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
  })

  it('should accept valid duration format input', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <InputDuration name="duration" label="Duration" />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/duration/i) as HTMLInputElement
    await user.type(input, 'P1Y2M3DT4H5M6S')
    expect(input.value).toBe('P1Y2M3DT4H5M6S')
  })

  it('should display label and description', () => {
    render(
      <TestWrapper>
        <InputDuration 
          name="duration" 
          label="Video Duration" 
          description="Enter duration in ISO 8601 format"
        />
      </TestWrapper>
    )
    expect(screen.getByText('Video Duration')).toBeInTheDocument()
    expect(screen.getByText('Enter duration in ISO 8601 format')).toBeInTheDocument()
  })
})
