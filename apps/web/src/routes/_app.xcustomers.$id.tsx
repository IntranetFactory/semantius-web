import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/xcustomers/$id')({
  component: () => null, // Content handled by parent route
})
