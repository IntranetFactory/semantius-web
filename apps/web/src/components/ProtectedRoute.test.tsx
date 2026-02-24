import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Helper to create a complete mock auth context
function createMockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}): ReturnType<typeof useAuth> {
  return {
    token: '',
    tokenData: undefined,
    idToken: undefined,
    idTokenData: undefined,
    logIn: vi.fn(),
    login: vi.fn(),
    logOut: vi.fn(),
    error: null,
    loginInProgress: false,
    userInfo: null,
    userInfoLoading: false,
    userInfoError: null,
    rpcUserInfo: null,
    rpcUserInfoLoading: false,
    rpcUserInfoError: null,
    isAuthReady: false,
    ...overrides,
  }
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows authenticating message when login is in progress', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      token: '',
      loginInProgress: true,
      isAuthReady: false,
    }))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Authenticating...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows redirecting message when no token and not logging in', () => {
    const mockLogin = vi.fn()
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      token: '',
      login: mockLogin,
      loginInProgress: false,
      isAuthReady: false,
    }))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Redirecting to login...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('calls login when no token is present', () => {
    const mockLogin = vi.fn()
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      token: '',
      login: mockLogin,
      loginInProgress: false,
      isAuthReady: false,
    }))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockLogin).toHaveBeenCalled()
  })

  it('shows loading message when token exists but auth is not ready', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      token: 'test-token',
      loginInProgress: false,
      isAuthReady: false,
    }))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading user information...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when token exists and auth is ready', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      token: 'test-token',
      loginInProgress: false,
      isAuthReady: true,
    }))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument()
    expect(screen.queryByText('Redirecting to login...')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading user information...')).not.toBeInTheDocument()
  })

  it('waits for isAuthReady before showing children', async () => {
    const mockLogin = vi.fn()
    const authState = createMockAuth({
      token: 'test-token',
      login: mockLogin,
      loginInProgress: false,
      isAuthReady: false,
    })

    vi.mocked(useAuth).mockReturnValue(authState)

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Initially should show loading
    expect(screen.getByText('Loading user information...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()

    // Update to ready state
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      token: 'test-token',
      login: mockLogin,
      loginInProgress: false,
      isAuthReady: true,
    }))

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Now should show protected content
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
    expect(screen.queryByText('Loading user information...')).not.toBeInTheDocument()
  })
})
