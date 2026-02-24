import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { ModuleSwitcher } from './ModuleSwitcher'
import { GalleryVerticalEnd } from 'lucide-react'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { ReactNode } from 'react'

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(() => ({
    moduleId: undefined,
    table_name: undefined,
    key: undefined,
  })),
  useNavigate: vi.fn(() => vi.fn()),
}))

describe('ModuleSwitcher', () => {
  beforeAll(() => {
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() { }
      unobserve() { }
      disconnect() { }
    }

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  const mockModules = [
    {
      name: 'Test Module 1',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Test Module 2',
      logo: 'https://example.com/logo.png',
      plan: 'Startup',
      logoColor: '#FF0000',
    },
  ]

  it('renders component logo correctly', () => {
    render(
      <SidebarProvider>
        <ModuleSwitcher modules={mockModules} />
      </SidebarProvider>
    )
    expect(screen.getByText('Test Module 1')).toBeInTheDocument()
  })

  it('renders image logo correctly', () => {
    render(
      <SidebarProvider>
        <ModuleSwitcher modules={[mockModules[1]]} />
      </SidebarProvider>
    )
    expect(screen.getByText('Test Module 2')).toBeInTheDocument()
    const img = screen.getByAltText('Test Module 2')
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
  })

  it('applies logo color correctly', () => {
    render(
      <SidebarProvider>
        <ModuleSwitcher modules={[mockModules[1]]} />
      </SidebarProvider>
    )
    const img = screen.getByAltText('Test Module 2')
    const container = img.parentElement
    expect(container).toHaveStyle({ backgroundColor: '#FF0000' })
  })
})
