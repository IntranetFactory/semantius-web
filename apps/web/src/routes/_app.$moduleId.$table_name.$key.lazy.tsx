import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_app/$moduleId/$table_name/$key')({
 component: () => null, // Content handled by parent route
})
