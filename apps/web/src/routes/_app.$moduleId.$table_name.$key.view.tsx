import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/$moduleId/$table_name/$key/view')({
  component: () => null, // Content handled by parent route (View.tsx)
})
