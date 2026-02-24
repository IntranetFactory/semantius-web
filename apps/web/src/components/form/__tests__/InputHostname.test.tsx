import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputHostname } from '../InputHostname'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputHostname', () => {
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
      defaultValues: { hostname: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          hostname: { type: 'string', format: 'hostname', inputMode }
        },
        required: inputMode === 'required' ? ['hostname'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render hostname input', () => {
    const { container } = render(
      <TestWrapper>
        <InputHostname name="hostname" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('placeholder', 'example.com')
  })

  it('should show required indicator when required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputHostname name="hostname" label="Hostname" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => !value || value.trim() === '' ? 'must not be empty' : undefined}
      >
        <InputHostname name="hostname" 
          label="Hostname"inputMode="required" validators={{
            onBlur: ({ value }) => !value || value.trim() === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/hostname/i)
    await user.click(input)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must not be empty/i)).toBeInTheDocument()
    })
  })

  it('should detect invalid hostname format', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          const hostnameRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
          return !hostnameRegex.test(value) ? 'must match format "hostname"' : undefined
        }}
      >
        <InputHostname 
          name="hostname" 
          label="Hostname"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              const hostnameRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
              return !hostnameRegex.test(value) ? 'must match format "hostname"' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/hostname/i)
    await user.type(input, 'invalid..hostname')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must match format "hostname"/i)).toBeInTheDocument()
    })
  })

  it('should accept valid hostname', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          const hostnameRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
          return !hostnameRegex.test(value) ? 'must match format "hostname"' : undefined
        }}
      >
        <InputHostname 
          name="hostname" 
          label="Hostname"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              const hostnameRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
              return !hostnameRegex.test(value) ? 'must match format "hostname"' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/hostname/i) as HTMLInputElement
    await user.type(input, 'example.com')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must match format "hostname"/i)).not.toBeInTheDocument()
      expect(input.value).toBe('example.com')
    })
  })

  it('should display label and description', () => {
    render(
      <TestWrapper>
        <InputHostname 
          name="hostname" 
          label="Server Hostname" 
          description="Enter the server hostname"
        />
      </TestWrapper>
    )
    expect(screen.getByText('Server Hostname')).toBeInTheDocument()
    expect(screen.getByText('Enter the server hostname')).toBeInTheDocument()
  })
})
