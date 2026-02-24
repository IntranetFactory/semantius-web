import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputIpv4 } from '../InputIpv4'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputIpv4', () => {
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
      defaultValues: { ipv4: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          ipv4: { type: 'string', format: 'ipv4', inputMode }
        },
        required: inputMode === 'required' ? ['ipv4'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render ipv4 input', () => {
    const { container } = render(
      <TestWrapper>
        <InputIpv4 name="ipv4" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('placeholder', '192.168.1.1')
  })

  it('should show required indicator when required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputIpv4 name="ipv4" label="IP Address" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => !value || value.trim() === '' ? 'must not be empty' : undefined}
      >
        <InputIpv4 name="ipv4" 
          label="IP Address"inputMode="required" validators={{
            onBlur: ({ value }) => !value || value.trim() === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/ip address/i)
    await user.click(input)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must not be empty/i)).toBeInTheDocument()
    })
  })

  it('should detect invalid IPv4 format', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          return !ipv4Regex.test(value) ? 'must match format "ipv4"' : undefined
        }}
      >
        <InputIpv4 
          name="ipv4" 
          label="IP Address"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
              return !ipv4Regex.test(value) ? 'must match format "ipv4"' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/ip address/i)
    await user.type(input, '256.1.1.1')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must match format "ipv4"/i)).toBeInTheDocument()
    })
  })

  it('should accept valid IPv4 address', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => {
          if (!value) return undefined
          const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          return !ipv4Regex.test(value) ? 'must match format "ipv4"' : undefined
        }}
      >
        <InputIpv4 
          name="ipv4" 
          label="IP Address"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return undefined
              const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
              return !ipv4Regex.test(value) ? 'must match format "ipv4"' : undefined
            },
          }}
        />
      </TestWrapper>
    )

    const input = screen.getByLabelText(/ip address/i) as HTMLInputElement
    await user.type(input, '192.168.1.1')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must match format "ipv4"/i)).not.toBeInTheDocument()
      expect(input.value).toBe('192.168.1.1')
    })
  })

  it('should display label and description', () => {
    render(
      <TestWrapper>
        <InputIpv4 
          name="ipv4" 
          label="Server IP" 
          description="Enter the server IPv4 address"
        />
      </TestWrapper>
    )
    expect(screen.getByText('Server IP')).toBeInTheDocument()
    expect(screen.getByText('Enter the server IPv4 address')).toBeInTheDocument()
  })
})
