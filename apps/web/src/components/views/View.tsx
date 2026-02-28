import { useNavigate, useRouterState } from '@tanstack/react-router'
import { type ViewProps } from "@/types/metadata"
import { useTable } from '@/hooks/useTable'
import { useUserHasPermission } from '@/hooks/useUserPermissions'
import { DataTableView } from '@/components/data-table-view/DataTableView'
import { EntityBreadcrumb } from '@/components/EntityBreadcrumb'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TableForm } from '@/components/form/TableForm'

type RecordType = Record<string, unknown>

/**
 * Standalone view for a single record (/module/entity/id/view) or new record creation (/module/entity/new).
 * Renders breadcrumbs + form without the data table list.
 */
function StandaloneFormView({
  metadata,
  recordId,
  moduleId,
  viewName,
  canEdit,
}: {
  metadata: ViewProps['metadata']
  recordId: string | null
  moduleId: string
  viewName: string
  canEdit: boolean
}) {
  const navigate = useNavigate()
  const idColumn = metadata.table?.id_column || 'id'
  const labelColumn = metadata.table?.label_column || ''

  // Fetch just the label column value for the breadcrumb display name
  const { data: labelData } = useTable(metadata.table?.table_name || '', {
    query: `select=${labelColumn}&${idColumn}=eq.${recordId}`,
    enabled: !!recordId && !!labelColumn,
  })

  const recordLabel = recordId
    ? (labelData?.[0]?.[labelColumn] as string) || String(recordId)
    : undefined

  const singularLabel = metadata.table?.singular_label || 'Record'
  const pageTitle = recordId
    ? recordLabel || singularLabel
    : `New ${singularLabel}`

  const handleSave = () => {
    navigate({ to: viewName })
  }

  return (
    <div className="space-y-6">
      <EntityBreadcrumb
        moduleId={moduleId}
        entityLabel={metadata.table?.plural_label || 'Records'}
        entityPath={viewName}
        recordLabel={pageTitle}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        {pageTitle}
      </h1>
      <TableForm
        schema={metadata}
        recordId={recordId}
        onClose={handleSave}
        formMode={recordId ? (canEdit ? 'edit' : 'view') : 'create'}
      />
    </div>
  )
}

export function View({ moduleId: _moduleId, table_name: _table_name, recordId: _recordId, metadata }: ViewProps) {
  const navigate = useNavigate()
  const routerState = useRouterState()

  // Extract primary key column name from metadata (source of truth)
  const idColumn = metadata.table?.id_column || 'id'

  // Check if user can edit - call hook unconditionally, then check if permission is required
  const hasEditPermission = useUserHasPermission(
    (metadata.table as { edit_permission?: string | null })?.edit_permission || ''
  )
  const canEdit = (metadata.table as { edit_permission?: string | null })?.edit_permission
    ? hasEditPermission
    : true

  // Parse URL to determine mode
  const pathname = routerState.location.pathname
  // Extract module_name and table_name from pathname (e.g., /crm/customers)
  const pathParts = pathname.split('/').filter(Boolean)
  const module_name = pathParts[0] || ''
  const table_name = pathParts[1] || ''
  const view_name = `/${module_name}/${table_name}`
  const escapedViewName = view_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Standalone mode detection: /module/entity/id/view or /module/entity/new
  const standaloneViewMatch = pathname.match(new RegExp(`^${escapedViewName}\/([^/]+)\/view$`))
  const isStandaloneNew = pathname === `${view_name}/new`
  const isStandalone = !!standaloneViewMatch || isStandaloneNew

  // Render standalone form (with breadcrumbs, no data table)
  if (isStandalone) {
    const standaloneRecordId = standaloneViewMatch?.[1] || null
    return (
      <StandaloneFormView
        metadata={metadata}
        recordId={standaloneRecordId}
        moduleId={module_name}
        viewName={view_name}
        canEdit={canEdit}
      />
    )
  }

  // --- Overlay mode: list + sheet/dialog ---

  // Inline create mode: /module/entity/create opens a blank form in the overlay
  const CREATE_SEGMENT = 'create'
  const isCreateMode = pathname === `${view_name}/${CREATE_SEGMENT}`

  const editMatch = pathname.match(new RegExp(`^${escapedViewName}\/([^/]+)\/edit$`))
  const viewMatchResult = pathname.match(new RegExp(`^${escapedViewName}\/([^/]+)$`))
  // Exclude 'create' from being treated as a record ID
  const viewMatch =
    viewMatchResult && !editMatch && viewMatchResult[1] !== CREATE_SEGMENT
      ? viewMatchResult
      : null

  const isEditMode = !!editMatch
  const recordId = editMatch?.[1] || viewMatch?.[1]
  const isOpen = isCreateMode || !!recordId

  const fieldCount = Object.keys(metadata.properties || {}).length
  // Determine display mode: modal for entities with many fields on wide screens
  const useModal = typeof window !== 'undefined' && window.innerWidth > 900 && fieldCount >= 10

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigatePreservingSearch = (opts: Record<string, unknown>) => {
    ;(navigate as any)({ ...opts, search: (prev: Record<string, unknown>) => prev })
  }

  const handleEdit = (record: RecordType) => {
    navigatePreservingSearch({
      to: `${view_name}/$id/edit`,
      params: { id: String(record[idColumn]) },
    })
  }

  // Both sidebar and modal use URL-based deep links — preserve search params
  const handleRowClick = (record: RecordType) => {
    navigatePreservingSearch({
      to: `${view_name}/$id`,
      params: { id: String(record[idColumn]) },
    })
  }

  const handleClose = () => {
    navigatePreservingSearch({ to: view_name })
  }

  return (
    <div className="space-y-6">
      <EntityBreadcrumb
        moduleId={module_name}
        entityLabel={metadata.table?.plural_label || 'Records'}
        entityPath={view_name}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {metadata.table?.plural_label || 'Records'}
          </h1>
          <p className="text-muted-foreground">
            {metadata.table?.description || 'Manage records'}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => navigatePreservingSearch({ to: `${view_name}/${CREATE_SEGMENT}` })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {metadata.table?.singular_label || 'Record'}
          </Button>
        )}
      </div>

      <DataTableView
        metadata={metadata}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onEditModal={(record) => {
          navigatePreservingSearch({
            to: `${view_name}/$id`,
            params: { id: String(record[idColumn]) },
          })
        }}
        editRoute={`${view_name}/$id/edit`}
        canEdit={canEdit}
        emptyMessage={`No ${metadata.table?.plural_label?.toLowerCase() || 'records'} found`}
        emptyIcon={<Users className="h-12 w-12 mb-2" />}
        excludeColumns={['created_at', 'updated_at']}
      />

      {/* Sheet for viewing/editing record - used when field count < 10 or narrow screen */}
      <Sheet open={isOpen && !useModal} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="w-full sm:max-w-[540px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>
              {isCreateMode
                ? `New ${metadata.table?.singular_label || 'Record'}`
                : `${metadata.table?.singular_label || 'Record'} ${recordId || ''}`}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            <TableForm
              schema={metadata}
              recordId={isCreateMode ? null : recordId}
              onClose={handleClose}
              formMode={isCreateMode ? 'create' : (isEditMode ? 'edit' : (canEdit ? 'edit' : 'view'))}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal for viewing/editing record - used when field count >= 10 on wide screens */}
      <Dialog open={useModal && isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {isCreateMode
                ? `New ${metadata.table?.singular_label || 'Record'}`
                : `${metadata.table?.singular_label || 'Record'} ${recordId || ''}`}
            </DialogTitle>
          </DialogHeader>
          <TableForm
            schema={metadata}
            recordId={isCreateMode ? null : recordId}
            onClose={handleClose}
            formMode={isCreateMode ? 'create' : (canEdit ? 'edit' : 'view')}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
