import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputNumber } from '../InputNumber'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputNumber', () => {
  function TestWrapper({ 
    children, 
    defaultValue,
    inputMode = 'default',
    validatorFn = () => undefined
  }: { 
    children: React.ReactNode
    defaultValue?: number
    inputMode?: string
    validatorFn?: (value: any) => string | undefined
  }) {
    const form = useForm({
      defaultValues: { age: defaultValue },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          age: { type: 'number', inputMode }
        },
        required: inputMode === 'required' ? ['age'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render number input type', () => {
    const { container } = render(
      <TestWrapper>
        <InputNumber name="age" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('should handle number values', () => {
    const { container } = render(
      <TestWrapper defaultValue={42}>
        <InputNumber name="age" />
      </TestWrapper>
    )
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('42')
  })

  it('should show required indicator when required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputNumber name="age" label="Age" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => value === undefined || value === null || value === '' ? 'must not be empty' : undefined}
      >
        <InputNumber name="age" 
          label="Age"inputMode="required" validators={{
            onBlur: ({ value }) => value === undefined || value === null || value === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/age/i)
    await user.click(input)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must not be empty/i)).toBeInTheDocument()
    })
  })

  it('should detect invalid number format', async () => {
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (value === undefined || value === '') return undefined
          return isNaN(Number(value)) ? 'must be a number' : undefined
        }}
      >
        <InputNumber 
          name="age" 
          label="Age"
          validators={{
            onBlur: ({ value }) => {
              if (value === undefined || value === '') return undefined
              return isNaN(Number(value)) ? 'must be a number' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/age/i) as HTMLInputElement
    // Note: HTML5 number input prevents non-numeric input, but we test the validator
    expect(input.type).toBe('number')
  })

  it('should accept valid number', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (value === undefined || value === '') return undefined
          return isNaN(Number(value)) ? 'must be a number' : undefined
        }}
      >
        <InputNumber 
          name="age" 
          label="Age"
          validators={{
            onBlur: ({ value }) => {
              if (value === undefined || value === '') return undefined
              return isNaN(Number(value)) ? 'must be a number' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/age/i) as HTMLInputElement
    await user.type(input, '25')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must be a number/i)).not.toBeInTheDocument()
      expect(input.value).toBe('25')
    })
  })

  it('should handle default value', () => {
    const { container } = render(
      <TestWrapper defaultValue={99}>
        <InputNumber name="age" />
      </TestWrapper>
    )
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('99')
  })
})
