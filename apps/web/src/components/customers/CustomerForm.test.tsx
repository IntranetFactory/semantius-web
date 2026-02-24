import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomerForm } from './CustomerForm'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import React from 'react'

// Mock the hooks
vi.mock('@/hooks/useTableMutations', () => ({
  useCreateRecord: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 1 }),
    isPending: false,
    error: null,
  }),
  useUpdateRecord: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 1 }),
    isPending: false,
    error: null,
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Sheet open={true}>
        <SheetContent>
          {children}
        </SheetContent>
      </Sheet>
    </QueryClientProvider>
  )
}

describe('CustomerForm', () => {
  it('renders create form with empty fields', () => {
    const onClose = vi.fn()
    
    render(
      <CustomerForm mode="create" onClose={onClose} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Create New Customer')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/)).toHaveValue('')
    expect(screen.getByLabelText(/Phone Number/)).toHaveValue('')
    expect(screen.getByLabelText(/Company Name/)).toHaveValue('')
    expect(screen.getByRole('button', { name: /Create Customer/i })).toBeInTheDocument()
  })

  it('renders edit form with customer data', () => {
    const customer = {
      id: 1,
      email: 'test@example.com',
      phone: '555-0100',
      company: 'Test Corp',
      status: 'active',
      total_orders: 5,
    }
    const onClose = vi.fn()

    render(
      <CustomerForm customer={customer} mode="edit" onClose={onClose} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Edit Customer')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/)).toHaveValue('test@example.com')
    expect(screen.getByLabelText(/Phone Number/)).toHaveValue('555-0100')
    expect(screen.getByLabelText(/Company Name/)).toHaveValue('Test Corp')
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
  })

  it('renders view mode with correct title and description', () => {
    const customer = {
      id: 1,
      email: 'test@example.com',
      phone: '555-0100',
      company: 'Test Corp',
      status: 'active',
      total_orders: 5,
    }
    const onClose = vi.fn()

    render(
      <CustomerForm customer={customer} mode="view" onClose={onClose} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Customer Details')).toBeInTheDocument()
    expect(screen.getByText('View customer information.')).toBeInTheDocument()
  })

  it('allows user to fill out the form', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <CustomerForm mode="create" onClose={onClose} />,
      { wrapper: createWrapper() }
    )

    const emailInput = screen.getByLabelText(/Email Address/)
    const phoneInput = screen.getByLabelText(/Phone Number/)
    const companyInput = screen.getByLabelText(/Company Name/)

    await user.type(emailInput, 'newuser@example.com')
    await user.type(phoneInput, '555-1234')
    await user.type(companyInput, 'New Company')

    expect(emailInput).toHaveValue('newuser@example.com')
    expect(phoneInput).toHaveValue('555-1234')
    expect(companyInput).toHaveValue('New Company')
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <CustomerForm mode="create" onClose={onClose} />,
      { wrapper: createWrapper() }
    )

    await user.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
