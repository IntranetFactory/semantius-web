import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useRef } from 'react'
import { type ViewProps, type ChildRelation } from "@/types/metadata"
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
  const postSaveTargetRef = useRef<string | null>(null)
  const FORM_ID = 'standalone-record-form'

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

  const handleBeforeSubmit = (submitter: Element | null) => {
    const childId = submitter instanceof HTMLElement ? submitter.dataset.childId : undefined
    postSaveTargetRef.current = childId ? '/' : null
  }

  const handleSave = () => {
    const target = postSaveTargetRef.current
    postSaveTargetRef.current = null
    navigate({ to: target || viewName })
  }

  const children: ChildRelation[] = metadata.children || []

  return (
    <div className="space-y-6">
      <EntityBreadcrumb
        moduleId={moduleId}
        entityLabel={metadata.table?.plural_label || 'Records'}
        entityPath={viewName}
        recordLabel={pageTitle}
      />
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {pageTitle}
        </h1>
        {children.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-end">
            {children.map((child) => (
              <Button
                key={child.id}
                type="submit"
                form={FORM_ID}
                data-child-id={child.id}
              >
                {child.plural_label}...
              </Button>
            ))}
          </div>
        )}
      </div>
      <TableForm
        schema={metadata}
        recordId={recordId}
        onClose={handleSave}
        formMode={recordId ? (canEdit ? 'edit' : 'view') : 'create'}
        formId={FORM_ID}
        onBeforeSubmit={handleBeforeSubmit}
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

  const editMode = metadata.table?.edit_mode || 'auto'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigatePreservingSearch = (opts: Record<string, unknown>) => {
    ;(navigate as any)({ ...opts, search: (prev: Record<string, unknown>) => prev })
  }

  /**
   * Single navigation function for all record interactions.
   * mode 'new'  → create form  (page: /new,       overlay: /create)
   * mode 'open' → view/edit form (page: /$id/view, overlay: /$id)
   */
  const navigateForEditMode = (mode: 'new' | 'open', record?: RecordType) => {
    if (mode === 'new') {
      if (editMode === 'page') {
        navigate({ to: `${view_name}/new` })
      } else {
        navigatePreservingSearch({ to: `${view_name}/create` })
      }
    } else {
      const id = record ? String(record[idColumn]) : undefined
      if (editMode === 'page') {
        navigate({ to: `${view_name}/${id}/view` })
      } else {
        navigatePreservingSearch({
          to: `${view_name}/$id`,
          params: { id: id! },
        })
      }
    }
  }

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

  // Determine overlay display mode based on edit_mode from schema metadata.
  // 'auto' (or unset): decide by field count and screen width.
  // 'modal': always use modal.
  // 'sidebar': always use sidebar.
  // 'page': not applicable here (handled by isStandalone above).
  const resolveDisplayMode = (): 'modal' | 'sidebar' => {
    if (editMode === 'modal') return 'modal'
    if (editMode === 'sidebar') return 'sidebar'
    // auto: wide screen + many fields → modal
    return typeof window !== 'undefined' && window.innerWidth > 900 && fieldCount >= 10
      ? 'modal'
      : 'sidebar'
  }
  const displayMode = resolveDisplayMode()
  const useModal = displayMode === 'modal'

  const handleClose = () => {
    navigatePreservingSearch({ to: view_name })
  }

  // Edit route template for DataTableView (used for keyboard/link navigation)
  const editRoute = editMode === 'page'
    ? `${view_name}/$id/view`
    : `${view_name}/$id/edit`

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
          <Button onClick={() => navigateForEditMode('new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add {metadata.table?.singular_label || 'Record'}
          </Button>
        )}
      </div>

      <DataTableView
        metadata={metadata}
        onRowClick={(record) => navigateForEditMode('open', record)}
        onEdit={(record) => navigateForEditMode('open', record)}
        onEditModal={(record) => navigateForEditMode('open', record)}
        editRoute={editRoute}
        canEdit={canEdit}
        emptyMessage={`No ${metadata.table?.plural_label?.toLowerCase() || 'records'} found`}
        emptyIcon={<Users className="h-12 w-12 mb-2" />}
        excludeColumns={['created_at', 'updated_at']}
      />

      {/* Sheet for viewing/editing record - used when field count < 10 or narrow screen */}
      <Sheet open={isOpen && !useModal} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="w-full sm:max-w-[540px] border-l-0" onOpenAutoFocus={(e) => e.preventDefault()}>
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
