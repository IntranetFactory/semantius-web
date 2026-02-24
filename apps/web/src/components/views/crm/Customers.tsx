import { useNavigate, useRouterState } from '@tanstack/react-router'
import { type ViewProps } from "@/types/metadata"
import { useTable } from '@/hooks/useTable'
import { useUserHasPermission } from '@/hooks/useUserPermissions'
import { TableView } from '@/components/table-view/TableView'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TableForm } from '@/components/form/TableForm'
import { useState } from 'react'

type RecordType = Record<string, unknown>

export function View({ moduleId: _moduleId, table_name: _table_name, recordId: _recordId, metadata }: ViewProps) {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [modalMode, setModalMode] = useState<'edit' | 'create' | 'view' | null>(null)
  const [modalRecord, setModalRecord] = useState<RecordType | undefined>(undefined)
  
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
  const viewMatchResult = pathname.match(new RegExp(`^${view_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/([^/]+)$`))
  const viewMatch = viewMatchResult && !editMatch ? viewMatchResult : null
  
  const isEditMode = !!editMatch
  const recordId = editMatch?.[1] || viewMatch?.[1]
  const isOpen = isNewMode || !!recordId

  const handleModalOpen = (mode: 'edit' | 'create' | 'view', record?: RecordType) => {
    setModalMode(mode)
    setModalRecord(record)
  }

  const handleModalClose = () => {
    setModalMode(null)
    setModalRecord(undefined)
  }

  const handleEdit = (record: RecordType) => {
    navigate({
      to: `${view_name}/$id/edit`,
      params: { id: String(record[idColumn]) },
    })
  }

  const handleRowClick = (record: RecordType) => {
    // Navigate to view/edit based on permissions - form will be editable if user has permission
    navigate({
      to: `${view_name}/$id`,
      params: { id: String(record[idColumn]) },
    })
  }

  const handleSheetClose = () => {
    navigate({ to: view_name })
  }

  // We don't need to fetch the selected record anymore since TableForm does it

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
            onClick={() => navigate({ to: `${view_name}/new` })}
          >
            <Plus className="mr-2 h-4 w-4" />
            New {metadata.table?.singular_label || 'Record'}
          </Button>
        )}
      </div>

      <TableView
        metadata={metadata}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onEditModal={(record) => handleModalOpen('edit', record)}
        editRoute={`${view_name}/$id/edit`}
        canEdit={canEdit}
        emptyMessage={`No ${metadata.table?.plural_label?.toLowerCase() || 'records'} found`}
        emptyIcon={<Users className="h-12 w-12 mb-2" />}
        excludeColumns={['created_at', 'updated_at']}
      />

      {/* Sheet for viewing/editing record - responsive: full screen on mobile */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isNewMode 
                ? `New ${metadata.table?.singular_label || 'Record'}` 
                : `${metadata.table?.singular_label || 'Record'} ${recordId || ''}`}
            </SheetTitle>
          </SheetHeader>
          <TableForm
            schema={metadata}
            recordId={isNewMode ? null : recordId}
            onClose={handleSheetClose}
            formMode={isNewMode ? 'create' : (canEdit ? 'edit' : 'view')}
          />
        </SheetContent>
      </Sheet>

      {/* Modal for editing record - responsive: full screen on mobile */}
      <Dialog open={!!modalMode} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <TableForm
            schema={metadata}
            recordId={modalRecord?.[idColumn] ? String(modalRecord[idColumn]) : undefined}
            onClose={handleModalClose}
            formMode={!canEdit || modalMode === 'view' ? 'view' : 'edit'}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
