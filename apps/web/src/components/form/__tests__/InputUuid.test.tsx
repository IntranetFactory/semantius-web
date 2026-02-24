import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputUuid } from '../InputUuid'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputUuid', () => {
  function TestWrapper({ 
    children, 
    inputMode = 'default',
    validatorFn = () => undefined
  }: { 
    children: React.ReactNode
    inputMode?: string
    validatorFn?: (value: any) => string | undefined
  }) {
    const form = useForm({
      defaultValues: { uuid: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          uuid: { type: 'string', format: 'uuid', inputMode }
        },
        required: inputMode === 'required' ? ['uuid'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render uuid input', () => {
    const { container } = render(
      <TestWrapper>
        <InputUuid name="uuid" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should show required indicator when required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputUuid name="uuid" label="ID" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => !value || value.trim() === '' ? 'must not be empty' : undefined}
      >
        <InputUuid name="uuid" 
          label="ID"inputMode="required" validators={{
            onBlur: ({ value }) => !value || value.trim() === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/id/i)
    await user.click(input)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must not be empty/i)).toBeInTheDocument()
    })
  })

  it('should detect invalid UUID format', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          return !uuidRegex.test(value) ? 'must match format "uuid"' : undefined
        }}
      >
        <InputUuid 
          name="uuid" 
          label="ID"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
              return !uuidRegex.test(value) ? 'must match format "uuid"' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/id/i)
    await user.type(input, 'not-a-uuid')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must match format "uuid"/i)).toBeInTheDocument()
    })
  })

  it('should accept valid UUID', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          return !uuidRegex.test(value) ? 'must match format "uuid"' : undefined
        }}
      >
        <InputUuid 
          name="uuid" 
          label="ID"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
              return !uuidRegex.test(value) ? 'must match format "uuid"' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/id/i) as HTMLInputElement
    await user.type(input, '123e4567-e89b-12d3-a456-426614174000')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must match format "uuid"/i)).not.toBeInTheDocument()
      expect(input.value).toBe('123e4567-e89b-12d3-a456-426614174000')
    })
  })
})
