import { useNavigate, useRouterState } from '@tanstack/react-router'
import { type ViewProps } from "@/types/metadata"
import { useUserHasPermission } from '@/hooks/useUserPermissions'
import { DataTableView } from '@/components/data-table-view/DataTableView'
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
import { PageBreadcrumb, buildBreadcrumbSegments } from '@/components/PageBreadcrumb'

type RecordType = Record<string, unknown>

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

  // Parse URL to determine sheet state
  const pathname = routerState.location.pathname
  // Extract module_name and table_name from pathname (e.g., /crm/customers)
  const pathParts = pathname.split('/').filter(Boolean)
  const module_name = pathParts[0] || ''
  const table_name = pathParts[1] || ''
  const view_name = `/${module_name}/${table_name}`

  const isNewMode = pathname === `${view_name}/new`
  const editMatch = pathname.match(new RegExp(`^${view_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/([^/]+)\/edit$`))
  const standaloneViewMatch = pathname.match(new RegExp(`^${view_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/([^/]+)\/view$`))
  const viewMatchResult = pathname.match(new RegExp(`^${view_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/([^/]+)$`))
  const viewMatch = viewMatchResult && !editMatch ? viewMatchResult : null

  const isEditMode = !!editMatch
  const isStandaloneView = !!standaloneViewMatch
  const recordId = editMatch?.[1] || standaloneViewMatch?.[1] || viewMatch?.[1]
  const isOpen = isNewMode || (!!recordId && !isStandaloneView)

  const fieldCount = Object.keys(metadata.properties || {}).length
  // Determine display mode: modal for entities with many fields on wide screens
  const useModal = typeof window !== 'undefined' && window.innerWidth > 900 && fieldCount >= 10

  const handleEdit = (record: RecordType) => {
    navigate({
      to: `${view_name}/$id/edit`,
      params: { id: String(record[idColumn]) },
      search: (prev: unknown) => ({ ...(prev as object) }),
    } as unknown as Parameters<typeof navigate>[0])
  }

  // Both sidebar and modal use URL-based deep links
  const handleRowClick = (record: RecordType) => {
    navigate({
      to: `${view_name}/$id`,
      params: { id: String(record[idColumn]) },
      search: (prev: unknown) => ({ ...(prev as object) }),
    } as unknown as Parameters<typeof navigate>[0])
  }

  const handleClose = () => {
    navigate({
      to: view_name,
      search: (prev: unknown) => ({ ...(prev as object) }),
    } as unknown as Parameters<typeof navigate>[0])
  }

  // We don't need to fetch the selected record anymore since TableForm does it

  // Standalone view mode: render form as a full page with breadcrumbs
  if (isStandaloneView && recordId) {
    const breadcrumbLabels: Record<string, string> = {}
    if (module_name) breadcrumbLabels[module_name] = module_name.toUpperCase()
    if (table_name && metadata.table?.plural_label) breadcrumbLabels[table_name] = metadata.table.plural_label
    const segments = buildBreadcrumbSegments(pathname, breadcrumbLabels)

    return (
      <div className="space-y-6">
        <PageBreadcrumb segments={segments} />
        <div className="max-w-3xl">
          <TableForm
            schema={metadata}
            recordId={recordId}
            onClose={handleClose}
            formMode={canEdit ? 'edit' : 'view'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            onClick={() => navigate({
              to: `${view_name}/new`,
              search: (prev: unknown) => ({ ...(prev as object) }),
            } as unknown as Parameters<typeof navigate>[0])}
          >
            <Plus className="mr-2 h-4 w-4" />
            New {metadata.table?.singular_label || 'Record'}
          </Button>
        )}
      </div>

      <DataTableView
        metadata={metadata}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onEditModal={(record) => {
          navigate({
            to: `${view_name}/$id`,
            params: { id: String(record[idColumn]) },
            search: (prev: unknown) => ({ ...(prev as object) }),
          } as unknown as Parameters<typeof navigate>[0])
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
              {isNewMode
                ? `New ${metadata.table?.singular_label || 'Record'}`
                : `${metadata.table?.singular_label || 'Record'} ${recordId || ''}`}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            <TableForm
              schema={metadata}
              recordId={isNewMode ? null : recordId}
              onClose={handleClose}
              formMode={isNewMode ? 'create' : (canEdit ? 'edit' : 'view')}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal for viewing/editing record - used when field count >= 10 on wide screens */}
      <Dialog open={useModal && !!recordId} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {`${metadata.table?.singular_label || 'Record'} ${recordId || ''}`}
            </DialogTitle>
          </DialogHeader>
          <TableForm
            schema={metadata}
            recordId={recordId}
            onClose={handleClose}
            formMode={canEdit ? 'edit' : 'view'}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
