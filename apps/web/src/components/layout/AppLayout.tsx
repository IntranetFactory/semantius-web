import { Outlet } from '@tanstack/react-router'
import { Header } from './Header'
import { AppSidebar } from './AppSidebar'
import {
  SidebarInset,
  SidebarProvider
} from '@/components/ui/sidebar'

export function AppLayout() {
  return (
    <SidebarProvider className="overflow-x-hidden">
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          
            <Header />
          
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0 overflow-x-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
