import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputUri } from '../InputUri'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputUri', () => {
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
      defaultValues: { uri: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          uri: { type: 'string', format: 'uri', inputMode }
        },
        required: inputMode === 'required' ? ['uri'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render uri input', () => {
    const { container } = render(
      <TestWrapper>
        <InputUri name="uri" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'url')
  })

  it('should show required indicator when required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputUri name="uri" label="Website" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => !value || value.trim() === '' ? 'must not be empty' : undefined}
      >
        <InputUri name="uri" 
          label="Website"inputMode="required" validators={{
            onBlur: ({ value }) => !value || value.trim() === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/website/i)
    await user.click(input)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must not be empty/i)).toBeInTheDocument()
    })
  })

  it('should detect invalid URI format', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          try {
            new URL(value)
            return undefined
          } catch {
            return 'must match format "uri"'
          }
        }}
      >
        <InputUri 
          name="uri" 
          label="Website"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              try {
                new URL(value)
                return undefined
              } catch {
                return 'must match format "uri"'
              }
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/website/i)
    await user.type(input, 'not-a-url')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must match format "uri"/i)).toBeInTheDocument()
    })
  })

  it('should accept valid URI', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          try {
            new URL(value)
            return undefined
          } catch {
            return 'must match format "uri"'
          }
        }}
      >
        <InputUri 
          name="uri" 
          label="Website"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              try {
                new URL(value)
                return undefined
              } catch {
                return 'must match format "uri"'
              }
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/website/i) as HTMLInputElement
    await user.type(input, 'https://example.com/path')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must match format "uri"/i)).not.toBeInTheDocument()
      expect(input.value).toBe('https://example.com/path')
    })
  })
})
