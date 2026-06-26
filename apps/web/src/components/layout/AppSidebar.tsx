"use client"

import * as React from "react"

import { NavApps } from '@/components/layout/NavApps'
import { NavBookmarks } from '@/components/layout/NavBookmarks'
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userInfo } = useAuth()

  const [selectedModuleId, setSelectedModuleId] = React.useState<number | null>(null)
  const [selectedModuleSlug, setSelectedModuleSlug] = React.useState<string | null>(null)

  const handleModuleChange = React.useCallback((moduleId: number | null, moduleSlug: string | null) => {
    setSelectedModuleId(moduleId)
    setSelectedModuleSlug(moduleSlug)
  }, [])

  const userData = {
    name: userInfo?.name || userInfo?.preferred_username || 'User',
    email: userInfo?.email || '',
    avatar: userInfo?.picture || '',
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ModuleSwitcher onModuleChange={handleModuleChange} />
      </SidebarHeader>
      <SidebarContent>
        <NavApps moduleId={selectedModuleId} moduleSlug={selectedModuleSlug} />
        <NavBookmarks />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
