import { createFileRoute, Outlet } from '@tanstack/react-router'

// Layout route — renders child routes ($table_name, index) without adding any wrapping
export const Route = createFileRoute('/_app/$moduleId')({
  component: () => <Outlet />,
})
