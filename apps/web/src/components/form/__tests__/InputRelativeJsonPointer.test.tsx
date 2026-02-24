import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { InputRelativeJsonPointer } from '../InputRelativeJsonPointer'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputRelativeJsonPointer', () => {
  function TestWrapper({ children }: { children: React.ReactNode }) {
    const form = useForm({
      defaultValues: { pointer: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { type: 'object', properties: {} },
      validateField: () => undefined,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render relative-json-pointer input', () => {
    const { container } = render(
      <TestWrapper>
        <InputRelativeJsonPointer name="pointer" />
      </TestWrapper>
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
  })
})
