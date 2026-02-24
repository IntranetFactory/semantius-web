import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import ErrorBoundary from '@/components/ErrorBoundary'

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we expect errors
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('catches errors and displays error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument()
  })

  it('displays error details when an error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // ErrorBoundary uses ApiErrorDisplay which shows the error message directly
    expect(screen.getByText(/Test error message/)).toBeInTheDocument()
  })

  it('provides a return to home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const homeButton = screen.getByRole('button', { name: /return to home/i })
    expect(homeButton).toBeInTheDocument()
  })

  it('navigates to home when reset button is clicked', async () => {
    const user = userEvent.setup()
    
    // Mock window.location.href
    const originalLocation = window.location
    // @ts-expect-error - Mocking window.location for testing
    delete window.location
    // @ts-expect-error - Mocking window.location for testing
    window.location = { href: '' }
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const homeButton = screen.getByRole('button', { name: /return to home/i })
    await user.click(homeButton)
    
    expect(window.location.href).toBe('/')
    
    // Restore original location
    // @ts-expect-error - Restoring mocked window.location
    window.location = originalLocation
  })
})
