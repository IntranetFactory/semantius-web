import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState, useEffect } from 'react'
import { GalleryVerticalEnd, RotateCcw, MoreHorizontal, Printer } from 'lucide-react'
import { AnalyticsDashboard, CubeProvider } from 'drizzle-cube/client'
import type { DashboardConfig } from 'drizzle-cube/client'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { NotFoundPage } from '@/components/NotFoundPage'
import { useUpdateRecord } from '@/hooks/useTableMutations'
import { useTable } from '@/hooks/useTable'
import { getConfig } from '@/lib/config'

export const Route = createFileRoute('/_app/$moduleId/')({
  validateSearch: (search: Record<string, unknown>) => ({
    print: search.print === 'true',
  }),
  component: ModuleHomeComponent,
})

const EMPTY_CONFIG: DashboardConfig = { portlets: [] }

function ModuleHomeComponent() {
  const { moduleId } = Route.useParams()
  const { print: isPrintMode } = Route.useSearch()
  const { rpcUserInfo, token } = useAuth()
  const updateModule = useUpdateRecord<{ id: number; dashboard_config: DashboardConfig | null }>('modules')
  const cubeApiUrl = getConfig().cubeApiUrl
    ? `${getConfig().cubeApiUrl}/${moduleId.toLowerCase()}/cubejs-api/v1`
    : undefined

  const module = rpcUserInfo?.modules?.find(
    (m) => m.module_name.toLowerCase() === moduleId.toLowerCase()
  )

  const { data: moduleConfigData, isLoading: isDashboardConfigLoading } = useTable<{ id: number; dashboard_config: DashboardConfig | null }>(
    'modules',
    {
      query: `module_name=ilike.${encodeURIComponent(moduleId)}&select=id,dashboard_config`,
      enabled: !!module,
    }
  )

  const [config, setConfig] = useState<DashboardConfig>(EMPTY_CONFIG)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  // Load dashboard_config from server whenever data arrives or moduleId changes
  useEffect(() => {
    if (!moduleConfigData) return
    const serverConfig = moduleConfigData[0]?.dashboard_config ?? EMPTY_CONFIG
    const configToSet = isPrintMode
      ? { ...serverConfig, eagerLoad: true, layoutMode: 'rows' as const }
      : serverConfig
    setConfig(configToSet)
  }, [moduleConfigData, isPrintMode])

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptionsMenu && !(event.target as HTMLElement).closest('[data-options-menu]')) {
        setShowOptionsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu])

  // Force light theme in print mode
  useEffect(() => {
    if (isPrintMode) {
      const originalTheme = document.documentElement.getAttribute('data-theme')
      document.documentElement.setAttribute('data-theme', 'light')
      document.body.classList.add('print-mode')
      return () => {
        if (originalTheme) document.documentElement.setAttribute('data-theme', originalTheme)
        document.body.classList.remove('print-mode')
      }
    }
  }, [isPrintMode])

  const handleConfigChange = useCallback((newConfig: DashboardConfig) => {
    setConfig(newConfig)
  }, [])

  const handleSave = useCallback(async (configToSave: DashboardConfig) => {
    if (!module) return
    await updateModule.mutateAsync({ id: module.id, dashboard_config: configToSave })
  }, [module, updateModule])

  const handleResetDashboard = useCallback(async () => {
    if (!module) return
    await updateModule.mutateAsync({ id: module.id, dashboard_config: null })
    setConfig(EMPTY_CONFIG)
    setShowResetConfirm(false)
  }, [module, updateModule])

  const handlePrint = useCallback(() => {
    window.open(`${window.location.pathname}?print=true`, '_blank')
  }, [])

  if (!module) {
    return <NotFoundPage />
  }

  const moduleHeader = (
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
  )

  if (updateModule.error) {
    return (
      <div className="space-y-6">
        {moduleHeader}
        <Card>
          <CardContent className="py-6 text-destructive text-sm">
            Failed to save dashboard: {updateModule.error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={isPrintMode ? 'print-mode' : 'space-y-6'}>
      {isPrintMode ? (
        <div className="mb-6 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{module.module_name}</h1>
        </div>
      ) : (
        <>
          {moduleHeader}

          <div className="flex justify-end gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border bg-background hover:bg-accent"
              title="Open print view"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <div className="relative" data-options-menu>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 border bg-background text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => { setShowResetConfirm(true); setShowOptionsMenu(false) }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <CubeProvider apiOptions={{ apiUrl: cubeApiUrl ?? '', credentials: 'omit' }} token={token ?? undefined}>
        {isDashboardConfigLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading dashboard…</div>
        ) : (
          <AnalyticsDashboard
            config={config}
            editable={!isPrintMode}
            onConfigChange={handleConfigChange}
            onSave={handleSave}
          />
        )}
      </CubeProvider>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reset Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to reset this dashboard? This will remove all customizations and cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium bg-background hover:bg-accent w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDashboard}
                disabled={updateModule.isPending}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-destructive hover:bg-destructive/90 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
              >
                {updateModule.isPending ? 'Resetting...' : 'Reset Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
