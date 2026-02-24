"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useTable } from '@/hooks/useTable'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

// Component that fetches and displays tables for the currently selected module
export function NavApps({
  moduleId,
  moduleName,
}: {
  moduleId: number | null
  moduleName: string | null
}) {
  const { isMobile } = useSidebar()
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()
  
  // Fetch tables filtered by module_id
  // Only fetch when we have a valid module_id
  // Note: tables table doesn't have table_id, primary key is likely id
  const { data: tables, isLoading, error } = useTable('tables', {
    query: moduleId ? `module_id=eq.${moduleId}&select=table_name,plural_label,icon_url,singular_label` : '',
    enabled: !!moduleId,
  })

  // Show error if fetch fails
  if (error) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Apps</SidebarGroupLabel>
        <ApiErrorDisplay error={error} title="Error loading apps" />
      </SidebarGroup>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Apps</SidebarGroupLabel>
        <div className="text-sm text-muted-foreground px-2 py-1">Loading...</div>
      </SidebarGroup>
    )
  }

  // Show empty state if no module selected or no tables
  if (!moduleId || !tables || tables.length === 0) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Apps</SidebarGroupLabel>
        <div className="text-sm text-muted-foreground px-2 py-1">
          {!moduleId ? 'Select a module to view apps' : 'No apps available'}
        </div>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Apps</SidebarGroupLabel>
      <SidebarMenu>
        {tables.map((table) => {
          const tableName = String(table.table_name || '')
          const label = String(table.plural_label || table.singular_label || tableName)
          const lowercasedModuleName = (moduleName || '').toLowerCase()
          const url = `/${lowercasedModuleName}/${tableName}`
          
          // Check if this link matches the current route
          const isActive = !!matchRoute({ to: url, fuzzy: true })
          
          return (
            <SidebarMenuItem key={tableName}>
              <SidebarMenuButton 
                isActive={isActive}
                onClick={(e) => {
                  e.preventDefault()
                  // Explicitly clear search params to avoid inheriting sortBy, page, etc. from current page
                  navigate({ to: url, search: {}, replace: true })
                }}
              >
                <Folder />
                <span>{label}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <Folder className="text-muted-foreground" />
                    <span>View App</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward className="text-muted-foreground" />
                    <span>Share App</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete App</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
