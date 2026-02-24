import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { InputTextarea } from '../InputTextarea'
import { FormProvider } from '../FormContext'
import type { FormContextValue } from '../FormContext'

describe('InputTextarea', () => {
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
      defaultValues: { text: '' },
      onSubmit: async () => {},
    })

    const mockContext: FormContextValue = {
      form,
      schema: { 
        type: 'object', 
        properties: {
          text: { format: 'text', inputMode }
        },
        required: inputMode === 'required' ? ['text'] : []
      },
      validateField: validatorFn,
    }

    return <FormProvider value={mockContext}>{children}</FormProvider>
  }

  it('should render textarea element', () => {
    const { container } = render(
      <TestWrapper>
        <InputTextarea name="text" />
      </TestWrapper>
    )
    const textarea = container.querySelector('textarea')
    expect(textarea).toBeTruthy()
  })

  it('should show required indicator when required', () => {
    render(
      <TestWrapper inputMode="required">
        <InputTextarea name="text" label="Description" inputMode="required" />
      </TestWrapper>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper inputMode="required" validatorFn={(value) => !value || value.trim() === '' ? 'must not be empty' : undefined}
      >
        <InputTextarea name="text" 
          label="Description"inputMode="required" validators={{
            onBlur: ({ value }) => !value || value.trim() === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const textarea = screen.getByLabelText(/description/i)
    await user.click(textarea)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/must not be empty/i)).toBeInTheDocument()
    })
  })

  it('should accept valid multi-line text', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        validatorFn={(value) => !value || value.trim() === '' ? 'must not be empty' : undefined}
      >
        <InputTextarea 
          name="text" 
          label="Description"
          validators={{
            onBlur: ({ value }) => !value || value.trim() === '' ? 'must not be empty' : undefined,
          }}
        />
      </TestWrapper>
    )

    const textarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement
    await user.type(textarea, 'Line 1\nLine 2\nLine 3')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must not be empty/i)).not.toBeInTheDocument()
      expect(textarea.value).toBe('Line 1\nLine 2\nLine 3')
    })
  })

  it('should display label and description', () => {
    render(
      <TestWrapper>
        <InputTextarea 
          name="text" 
          label="Biography" 
          description="Enter your biography (multi-line text)"
        />
      </TestWrapper>
    )
    expect(screen.getByText('Biography')).toBeInTheDocument()
    expect(screen.getByText('Enter your biography (multi-line text)')).toBeInTheDocument()
  })
})
