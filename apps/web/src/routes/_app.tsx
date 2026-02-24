import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    // Check if user is authenticated before any loaders run
    if (!context.auth.isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: () => (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  ),
})
