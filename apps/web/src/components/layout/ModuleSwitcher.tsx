"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { useParams } from '@tanstack/react-router'
import { useModuleNavigate } from '@/hooks/useModuleNavigate'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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
    alias?: string
    logo: React.ElementType | string | null
    plan: string
    logoColor?: string | null
    id?: number
    home_page?: string
  }[]
  onModuleChange?: (moduleId: number | null, moduleName: string | null) => void
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
    })
  }, [navigateToModule])

  // Update active module when URL changes (moduleId from params)
  React.useEffect(() => {
    if (moduleId && modules.length > 0) {
      // Find module by matching the lowercased name or alias (when not empty)
      const moduleIdLower = moduleId.toLowerCase()
      const module = modules.find(m => {
        const nameLower = m.name.toLowerCase()
        const aliasLower = m.alias?.toLowerCase()
        // Match against module_name or alias (when alias is not empty)
        return nameLower === moduleIdLower || (aliasLower && aliasLower.trim() !== '' && aliasLower === moduleIdLower)
      })
      if (module && module !== activeModule) {
        setActiveModule(module)
      }
    }
  }, [moduleId, modules, activeModule])

  // Notify parent when active module changes
  React.useEffect(() => {
    if (activeModule && onModuleChange) {
      onModuleChange(activeModule.id || null, activeModule.name)
    }
  }, [activeModule, onModuleChange])

  if (!activeModule) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden"
                style={activeModule.logoColor ? { backgroundColor: activeModule.logoColor } : undefined}
              >
                {typeof activeModule.logo === 'string' ? (
                  <img src={activeModule.logo} alt={activeModule.name} className="size-full object-cover" />
                ) : activeModule.logo ? (
                  <activeModule.logo className="size-4" />
                ) : null}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeModule.name}</span>
                <span className="truncate text-xs">{activeModule.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {modules.map((module, index) => (
              <DropdownMenuItem
                key={module.name}
                onClick={() => handleModuleClick(module)}
                className="gap-2 p-2"
              >
                <div
                  className="flex size-6 items-center justify-center rounded-md border overflow-hidden"
                  style={module.logoColor ? { backgroundColor: module.logoColor } : undefined}
                >
                  {typeof module.logo === 'string' ? (
                    <img src={module.logo} alt={module.name} className="size-full object-cover" />
                  ) : module.logo ? (
                    <module.logo className="size-3.5 shrink-0 text-white" />
                  ) : null}
                </div>
                {module.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
