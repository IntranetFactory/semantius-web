import { Outlet, useNavigate, useMatchRoute, createLazyFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

export const Route = createLazyFileRoute('/_app/crm/home')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  
  // Check if we're on a child route
  const isDetailOpen = !!matchRoute({ to: '/crm/home/detail' })

  const handleOpenSidebar = () => {
    navigate({ to: '/crm/home/detail' })
  }

  const handleCloseSidebar = () => {
    navigate({ to: '/crm/home' })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">CRM Home</h1>
      <Button onClick={handleOpenSidebar}>Open Sidebar</Button>

      <Sheet open={isDetailOpen} onOpenChange={(open) => !open && handleCloseSidebar()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detail View</SheetTitle>
            <SheetDescription>
              This is a sidebar opened via a subroute
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <Outlet />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
