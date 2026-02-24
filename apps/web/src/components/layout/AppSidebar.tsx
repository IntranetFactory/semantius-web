"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from '@/components/layout/NavMain'
import { NavApps } from '@/components/layout/NavApps'
import { NavUser } from '@/components/layout/NavUser'
import { ModuleSwitcher } from '@/components/layout/ModuleSwitcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'

// This is sample data.
const staticData = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "/settings",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userInfo, rpcUserInfo } = useAuth()
  
  // Track the currently selected module
  const [selectedModuleId, setSelectedModuleId] = React.useState<number | null>(null)
  const [selectedModuleName, setSelectedModuleName] = React.useState<string | null>(null)
  
  // Callback to handle module changes from ModuleSwitcher
  const handleModuleChange = React.useCallback((moduleId: number | null, moduleName: string | null) => {
    setSelectedModuleId(moduleId)
    setSelectedModuleName(moduleName)
  }, [])

  // Create user data from authenticated user info
  const userData = {
    name: userInfo?.name || userInfo?.preferred_username || 'User',
    email: userInfo?.email || '',
    avatar: userInfo?.picture || '',
  }

  // Get user's permissions array for filtering
  const userPermissions = (rpcUserInfo?.permissions as string[] | undefined) || []

  // Map modules to teams format and filter based on permissions
  // We skip modules where user has neither view nor edit permission
  const dynamicModules = rpcUserInfo?.modules
    ?.filter((module) => {
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
    })
    .map((module) => ({
      name: module.module_name,
      alias: module.alias, // Pass alias for URL matching
      logo: module.logo_url || GalleryVerticalEnd,
      plan: module.description,
      logoColor: module.logo_color || '#0000FF',
      id: module.id,
      home_page: module.home_page, // Pass home_page for navigation
    })) || [] 

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ModuleSwitcher modules={dynamicModules} onModuleChange={handleModuleChange} />
      </SidebarHeader>
      <SidebarContent>
        <NavApps moduleId={selectedModuleId} moduleName={selectedModuleName} />
        <NavMain items={staticData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
