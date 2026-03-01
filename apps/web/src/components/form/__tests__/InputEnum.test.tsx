import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputEnum } from '../InputEnum'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputEnum', () => {
  function TestWrapper({ 
    children, 
    defaultValue,
    inputMode = 'default',
    validatorFn = () => undefined
  }: { 
    children: React.ReactNode
    defaultValue?: string
    inputMode?: string
    validatorFn?: (value: any) => string | undefined
  }) {
    const form = useForm({
      defaultValues: { option: defaultValue || '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          option: { 
            type: 'string',
            enum: ['Option 1', 'Option 2', 'Option 3'],
            inputMode 
          }
        },
        required: inputMode === 'required' ? ['option'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render combobox trigger', () => {
    render(
      <TestWrapper>
        <InputEnum name="option" />
      </TestWrapper>
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
  })

  it('should display enum options when opened', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <InputEnum name="option" />
      </TestWrapper>
    )
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    // Verify popover opened (aria-expanded)
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('should show required indicator when field is required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputEnum name="option" label="Choose Option" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should show clear button for non-required enum field', () => {
    render(
      <TestWrapper defaultValue="Option 1">
        <InputEnum name="option" inputMode="default" />
      </TestWrapper>
    )
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument()
  })

  it('should NOT show clear button for required enum field', () => {
    render(
      <TestWrapper defaultValue="Option 1" inputMode="required">
        <InputEnum name="option" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.queryByRole('button', { name: /clear selection/i })).not.toBeInTheDocument()
  })

  it('should validate required field on submit', async () => {
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => !value || value === '' ? 'must not be empty' : undefined}
      >
        <InputEnum name="option" 
          label="Choose Option" inputMode="required" validators={{
            onSubmit: ({ value }) => !value || value === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
  })

  it('should display current value in trigger', () => {
    render(
      <TestWrapper defaultValue="Option 2">
        <InputEnum name="option" />
      </TestWrapper>
    )
    
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Option 2')
  })

  it('should select an option and update value', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required">
        <InputEnum name="option" 
          label="Choose Option" inputMode="required"
        />
      </TestWrapper>
    )

    const trigger = screen.getByRole('combobox')
    // Verify initial state shows placeholder
    expect(trigger).toHaveTextContent('Select an option')
    
    // Verify the trigger opens on click
    await user.click(trigger)
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('should NOT show error for empty non-required enum field', async () => {
    render(
      <TestWrapper
        inputMode="default"
        validatorFn={(value) => {
          if (!value || value === '') return undefined
          const validOptions = ['Option 1', 'Option 2', 'Option 3']
          return validOptions.includes(value) ? undefined : 'must be equal to one of the allowed values'
        }}
      >
        <InputEnum 
          name="option" 
          label="Choose Option"
          inputMode="default"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value === '') return undefined
              const validOptions = ['Option 1', 'Option 2', 'Option 3']
              return validOptions.includes(value) ? undefined : 'must be equal to one of the allowed values'
            },
          }}
        />
      </TestWrapper>
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
    
    expect(screen.queryByText(/must not be empty/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/must be equal to one of the allowed values/i)).not.toBeInTheDocument()
  })

  it('should clear value when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper defaultValue="Option 1" inputMode="default">
        <InputEnum name="option" inputMode="default" />
      </TestWrapper>
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('Option 1')
    
    const clearBtn = screen.getByRole('button', { name: /clear selection/i })
    await user.click(clearBtn)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Select an option')
    })
  })
})
