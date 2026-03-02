import { createFileRoute } from '@tanstack/react-router'
import { GalleryVerticalEnd, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useModuleNavigate } from '@/hooks/useModuleNavigate'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'

export const Route = createFileRoute('/_app/')({
  component: IndexComponent,
})

function IndexComponent() {
  const navigateToModule = useModuleNavigate()
  const { rpcUserInfo } = useAuth()

  // Get user's permissions array for filtering
  const userPermissions = (rpcUserInfo?.permissions as string[] | undefined) || []

  // Filter modules based on permissions (same logic as AppSidebar)
  // We skip modules where user has neither view nor edit permission
  const modules = rpcUserInfo?.modules?.filter((module) => {
    // Allow modules without permission requirements
    if (!module.view_permission && !module.edit_permission) {
      return true
    }
    
    // Collect non-empty permissions to check
    const permissionsToCheck: string[] = []
    if (module.view_permission) permissionsToCheck.push(module.view_permission)
    if (module.edit_permission) permissionsToCheck.push(module.edit_permission)
    
    // User must have at least one of view or edit permission
    return permissionsToCheck.some(permission => userPermissions.includes(permission))
  }) || []

  const handleModuleClick = (module: typeof modules[0]) => {
    navigateToModule({
      homePage: module.home_page,
      moduleId: module.id,
      moduleName: module.module_name,
    })
  }

  // Loading state
  if (!rpcUserInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
          <p className="text-muted-foreground">
            Loading your available modules...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          Select a module to get started
        </p>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <GalleryVerticalEnd className="h-12 w-12 mb-2" />
            <p>No modules available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] p-6"
              onClick={() => handleModuleClick(module)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex size-16 items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-md transition-transform group-hover:scale-110"
                  style={module.logo_color ? { backgroundColor: module.logo_color } : { backgroundColor: '#0000FF' }}
                >
                  {module.logo_url ? (
                    <img src={module.logo_url} alt={module.module_name} className="size-full object-cover" />
                  ) : (
                    <GalleryVerticalEnd className="size-7 text-white" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {module.module_name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {module.description || 'No description available'}
                  </CardDescription>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
