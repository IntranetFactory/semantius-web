import { createFileRoute } from '@tanstack/react-router'
import { GalleryVerticalEnd } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { NotFoundPage } from '@/components/NotFoundPage'

export const Route = createFileRoute('/_app/$moduleId/')({
  component: ModuleHomeComponent,
})

function ModuleHomeComponent() {
  const { moduleId } = Route.useParams()
  const { rpcUserInfo } = useAuth()

  const module = rpcUserInfo?.modules?.find(
    (m) => m.module_name.toLowerCase() === moduleId.toLowerCase()
  )

  if (!module) {
    return <NotFoundPage />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="flex size-16 items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-md"
          style={module.logo_color ? { backgroundColor: module.logo_color } : { backgroundColor: '#0000FF' }}
        >
          {module.logo_url ? (
            <img src={module.logo_url} alt={module.module_name} className="size-full object-cover" />
          ) : (
            <GalleryVerticalEnd className="size-7 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{module.module_name}</h1>
          {module.description && (
            <p className="text-muted-foreground mt-1">{module.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="py-6 text-muted-foreground text-sm">
          Select an item from the sidebar to get started.
        </CardContent>
      </Card>
    </div>
  )
}
