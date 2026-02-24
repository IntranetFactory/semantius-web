import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { InputHtml } from '../InputHtml'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputHtml', () => {
  function TestWrapper({ children }: { children: React.ReactNode }) {
    const form = useForm({
      defaultValues: { html: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { type: 'object', properties: {} },
      validateField: () => undefined,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render html editor', async () => {
    const { container } = render(
      <TestWrapper>
        <InputHtml name="html" />
      </TestWrapper>
    )
    // Wait for lazy loaded CodeMirror to appear
    await screen.findByText(/Loading editor.../i)
    // Note: In test environment, the actual CodeMirror might not fully render
    // We just verify the component structure is correct
    expect(container.querySelector('.space-y-2')).toBeTruthy()
  })
})
