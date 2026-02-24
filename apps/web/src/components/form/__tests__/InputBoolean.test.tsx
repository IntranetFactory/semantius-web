import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { InputBoolean } from '../InputBoolean'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputBoolean', () => {
  function TestWrapper({ children, defaultValue }: { children: React.ReactNode, defaultValue?: boolean }) {
    const form = useForm({
      defaultValues: { agree: defaultValue || false },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { type: 'object', properties: {} },
      validateField: () => undefined,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render checkbox', () => {
    render(
      <TestWrapper>
        <InputBoolean name="agree" />
      </TestWrapper>
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
  })

  it('should be checked when value is true', () => {
    render(
      <TestWrapper defaultValue={true}>
        <InputBoolean name="agree" />
      </TestWrapper>
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('should not show required indicator even when required prop is passed', () => {
    render(
      <TestWrapper>
        <InputBoolean name="agree" label="I agree" inputMode="required" />
      </TestWrapper>
    )
    // Should not show required asterisk for boolean/checkbox
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('should handle default value of false', () => {
    render(
      <TestWrapper defaultValue={false}>
        <InputBoolean name="agree" />
      </TestWrapper>
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('should handle default value of true', () => {
    render(
      <TestWrapper defaultValue={true}>
        <InputBoolean name="agree" />
      </TestWrapper>
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })
})
