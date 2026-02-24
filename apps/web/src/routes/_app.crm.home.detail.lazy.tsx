import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_app/crm/home/detail')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <p className="text-muted-foreground">
        This is the sidebar content from the detail subroute.
      </p>
      <p className="mt-4">
        You can add any content here - forms, data displays, or other components.
      </p>
    </div>
  )
}
