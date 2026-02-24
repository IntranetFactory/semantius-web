import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiErrorDisplay } from './ApiErrorDisplay'

describe('ApiErrorDisplay', () => {
  it('displays error message', () => {
    const error = new Error('Failed to fetch data')
    render(<ApiErrorDisplay error={error} />)
    
    expect(screen.getByText('Error loading data')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument()
  })

  it('displays custom title', () => {
    const error = new Error('Network error')
    render(<ApiErrorDisplay error={error} title="Connection failed" />)
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument()
  })

  it('shows details button when error has additional properties', () => {
    const error = {
      message: 'API Error',
      hint: 'Check your API key',
      code: 401,
    }
    render(<ApiErrorDisplay error={error} />)
    
    expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument()
  })

  it('expands and collapses details', async () => {
    const user = userEvent.setup()
    const error = {
      message: 'API Error',
      hint: 'Check your API key',
      statusCode: 401,
    }
    render(<ApiErrorDisplay error={error} />)
    
    const detailsButton = screen.getByRole('button', { name: /details/i })
    
    // Details should not be visible initially
    expect(screen.queryByText(/"hint"/)).not.toBeInTheDocument()
    
    // Click to expand
    await user.click(detailsButton)
    expect(screen.getByText(/"hint"/)).toBeInTheDocument()
    expect(screen.getByText(/Check your API key/)).toBeInTheDocument()
    
    // Click to collapse
    await user.click(screen.getByRole('button', { name: /details/i }))
    expect(screen.queryByText(/"hint"/)).not.toBeInTheDocument()
  })

  it('hides details button when error has no additional properties', () => {
    const error = new Error('Simple error')
    render(<ApiErrorDisplay error={error} />)
    
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument()
  })
})
