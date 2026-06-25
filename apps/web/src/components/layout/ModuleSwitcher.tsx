"use client"

import * as React from "react"
import { ChevronsUpDown, Search } from "lucide-react"
import { useParams } from '@tanstack/react-router'
import { useModuleNavigate } from '@/hooks/useModuleNavigate'
import { openCommandPalette } from './CommandPalette'
import { PlatformShortcut } from '@/components/ui-ext/platform-shortcut'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function ModuleSwitcher({
  modules,
  onModuleChange,
}: {
  modules: {
    name: string
    displayName: string
    displayTitle: string
    slug: string
    alias?: string
    logo: React.ElementType | string | null
    plan: string
    logoColor?: string | null
    id?: number
    home_page?: string
  }[]
  onModuleChange?: (moduleId: number | null, moduleSlug: string | null) => void
}) {
  const params = useParams({ strict: false })
  const { moduleId } = params as { moduleId?: string; table_name?: string; key?: string }
  const navigateToModule = useModuleNavigate()

  const { isMobile } = useSidebar()
  const [activeModule, setActiveModule] = React.useState(modules[0])

  // Handler for module click - navigate to home_page if available
  const handleModuleClick = React.useCallback((module: typeof modules[0]) => {
    setActiveModule(module)
    navigateToModule({
      homePage: module.home_page,
      moduleId: module.id,
      moduleName: module.name,
      moduleSlug: module.slug,
    })
  }, [navigateToModule])

  // Update active module when URL changes (moduleId from params matches slug)
  React.useEffect(() => {
    if (moduleId && modules.length > 0) {
      // Find module by matching the slug
      const moduleIdLower = moduleId.toLowerCase()
      const module = modules.find(m => m.slug.toLowerCase() === moduleIdLower)
      if (module && module !== activeModule) {
        setActiveModule(module)
      }
    }
  }, [moduleId, modules, activeModule])

  // Notify parent when active module changes
  React.useEffect(() => {
    if (activeModule && onModuleChange) {
      onModuleChange(activeModule.id || null, activeModule.slug || null)
    }
  }, [activeModule, onModuleChange])

  if (!activeModule) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div
              className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden"
              style={activeModule.logoColor ? { backgroundColor: activeModule.logoColor } : undefined}
            >
              {typeof activeModule.logo === 'string' ? (
                <img src={activeModule.logo} alt={activeModule.displayName} className="size-full object-cover" />
              ) : activeModule.logo ? (
                <activeModule.logo className="size-4" />
              ) : null}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeModule.displayName}</span>
              {activeModule.displayTitle && (
                <span className="truncate text-xs">{activeModule.displayTitle}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuItem
              onClick={openCommandPalette}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <Search className="size-3.5 shrink-0" />
              </div>
              Quick navigation
              <PlatformShortcut modifier="mod" keyLabel="K" className="ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {modules.map((module) => (
              <DropdownMenuItem
                key={module.slug}
                onClick={() => handleModuleClick(module)}
                className="gap-2 p-2"
              >
                <div
                  className="flex size-6 items-center justify-center rounded-md border overflow-hidden"
                  style={module.logoColor ? { backgroundColor: module.logoColor } : undefined}
                >
                  {typeof module.logo === 'string' ? (
                    <img src={module.logo} alt={module.displayName} className="size-full object-cover" />
                  ) : module.logo ? (
                    <module.logo className="size-3.5 shrink-0 text-white" />
                  ) : null}
                </div>
                {module.displayName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
