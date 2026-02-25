import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { type EntityMetadata, type TableMetadata } from '@/types/metadata'
import { useTable } from '@/hooks/useTable'
import { useConfirmDelete } from '@/hooks/useConfirmDelete'
import { useUserHasPermission } from '@/hooks/useUserPermissions'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { buildPostgRESTSelect } from '@/lib/apiClient'
import {
  type SortingState,
  type ColumnFiltersState,
  type Updater,
  type PaginationState,
} from '@tanstack/react-table'
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from '@/components/niko-table/core'
import { DataTablePagination } from '@/components/niko-table/components/data-table-pagination'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableFilterMenu } from '@/components/niko-table/components/data-table-filter-menu'
import { DataTableViewMenu } from '@/components/niko-table/components/data-table-view-menu'
import { DataTableSortMenu } from '@/components/niko-table/components/data-table-sort-menu'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import { DataTableColumnHeader } from '@/components/niko-table/components/data-table-column-header'
import { DataTableColumnTitle } from '@/components/niko-table/components/data-table-column-title'
import { DataTableColumnSortMenu } from '@/components/niko-table/components/data-table-column-sort'
import { FILTER_VARIANTS, type FilterVariant } from '@/components/niko-table/lib/constants'
import type { DataTableColumnDef, ExtendedColumnFilter } from '@/components/niko-table/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react'

type RecordType = Record<string, unknown>

export interface DataTableViewProps {
  metadata: EntityMetadata
  onRowClick?: (record: RecordType) => void
  onEdit?: (record: RecordType) => void
  onEditModal?: (record: RecordType) => void
  editRoute?: string
  canEdit?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  excludeColumns?: string[]
}

// Helper to map metadata property type to niko-table filter variant
function getFilterVariant(property: {
  type?: string | string[]
  enum?: string[]
  reference_table?: string
}): FilterVariant {
  if (property.enum && property.enum.length > 0) return FILTER_VARIANTS.SELECT
  if (property.reference_table) return FILTER_VARIANTS.SELECT
  const type = Array.isArray(property.type) ? property.type[0] : property.type
  if (type === 'integer' || type === 'number') return FILTER_VARIANTS.NUMBER
  if (type === 'boolean') return FILTER_VARIANTS.BOOLEAN
  return FILTER_VARIANTS.TEXT
}

export function DataTableView({
  metadata,
  onRowClick,
  onEdit,
  onEditModal,
  editRoute,
  canEdit = true,
  emptyMessage,
  emptyIcon: _emptyIcon,
  excludeColumns = [],
}: DataTableViewProps) {
  const tableMetadata = metadata.table as TableMetadata | undefined

  if (!tableMetadata) throw new Error('DataTableView requires metadata.table to be defined')
  if (!tableMetadata.table_name) throw new Error('DataTableView requires metadata.table.table_name to be defined')
  if (!tableMetadata.id_column) throw new Error('DataTableView requires metadata.table.id_column to be defined')
  if (!tableMetadata.label_column) throw new Error('DataTableView requires metadata.table.label_column to be defined')

  const tableName = tableMetadata.table_name
  const primaryKeyColumn = tableMetadata.id_column
  const displayColumn = tableMetadata.label_column

  // --- URL search params ---
  const searchParams = useSearch({
    strict: false,
    select: (search) => ({
      page: (search as { page?: number }).page,
      pageSize: (search as { pageSize?: number }).pageSize,
      sortBy: (search as { sortBy?: string }).sortBy,
      sortOrder: (search as { sortOrder?: 'asc' | 'desc' }).sortOrder,
      search: (search as { search?: string }).search,
    }),
    structuralSharing: true,
  })

  const navigate = useNavigate()

  const getDefaultPageSize = () => {
    const h = window.innerHeight
    if (h > 1330) return 20
    if (h > 1070) return 15
    return 10
  }

  // --- Controlled pagination state (synced with URL) ---
  const [pagination, setPaginationState] = useState<PaginationState>(() => ({
    pageIndex: searchParams.page ? searchParams.page - 1 : 0,
    pageSize: searchParams.pageSize || getDefaultPageSize(),
  }))

  // --- Controlled sorting state (synced with URL) ---
  const [sorting, setSortingState] = useState<SortingState>(() => {
    const sortByCol = searchParams.sortBy
    const colExists = sortByCol && metadata.properties?.[sortByCol]
    return colExists
      ? [{ id: sortByCol, desc: searchParams.sortOrder === 'desc' }]
      : [{ id: primaryKeyColumn, desc: true }]
  })

  // --- Global search state (synced with URL) ---
  const [globalFilter, setGlobalFilterState] = useState<string>(
    searchParams.search || ''
  )

  // --- Column filters (client-side, NOT synced to URL for simplicity) ---
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Reset table state when navigating to a different table
  useEffect(() => {
    setPaginationState({
      pageIndex: searchParams.page ? searchParams.page - 1 : 0,
      pageSize: searchParams.pageSize || getDefaultPageSize(),
    })
    const sortByCol = searchParams.sortBy
    const colExists = sortByCol && metadata.properties?.[sortByCol]
    setSortingState(
      colExists
        ? [{ id: sortByCol, desc: searchParams.sortOrder === 'desc' }]
        : [{ id: primaryKeyColumn, desc: true }]
    )
    setGlobalFilterState(searchParams.search || '')
  }, [tableName]) // only re-run when the table changes

  // Sync URL when pagination / sorting / search change
  useEffect(() => {
    const currentPage = searchParams.page || 1
    const currentPageSize = searchParams.pageSize || 10
    const currentSortBy = searchParams.sortBy
    const currentSortOrder = searchParams.sortOrder || 'asc'
    const currentSearch = searchParams.search || ''

    const targetPage = pagination.pageIndex + 1
    const targetPageSize = pagination.pageSize
    const targetSortBy = sorting[0]?.id
    const targetSortOrder = sorting[0]?.desc ? 'desc' : 'asc'
    const targetSearch = globalFilter

    if (
      currentPage === targetPage &&
      currentPageSize === targetPageSize &&
      currentSortBy === targetSortBy &&
      currentSortOrder === targetSortOrder &&
      currentSearch === targetSearch
    ) return

    navigate({
      search: (prev: unknown) => ({
        ...(prev as object),
        page: targetPage,
        pageSize: targetPageSize,
        ...(targetSortBy ? { sortBy: targetSortBy, sortOrder: targetSortOrder } : {}),
        ...(targetSearch ? { search: targetSearch } : {}),
      }),
      replace: true,
      resetScroll: false,
    } as Parameters<typeof navigate>[0])
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter])

  // --- Build PostgREST query ---
  const query = useMemo(() => {
    const params: string[] = []
    const selectClause = buildPostgRESTSelect(metadata)
    params.push(`select=${selectClause}`)
    params.push(`limit=${pagination.pageSize}`)
    params.push(`offset=${pagination.pageIndex * pagination.pageSize}`)
    if (sorting.length > 0) {
      params.push(`order=${sorting.map(s => `${s.id}.${s.desc ? 'desc' : 'asc'}`).join(',')}`)
    }
    return params.join('&')
  }, [pagination.pageIndex, pagination.pageSize, sorting, metadata])

  const { data, totalCount, isLoading, error, refetch } = useTable<RecordType>(tableName, {
    query,
    count: true,
    placeholderData: (prev) => prev,
  })

  if (error) throw error

  const totalPages = totalCount ? Math.ceil(totalCount / pagination.pageSize) : undefined

  // --- Permissions ---
  const hasEditPermission = useUserHasPermission(tableMetadata?.edit_permission || '')
  const effectiveCanEdit = canEdit && (tableMetadata?.edit_permission ? hasEditPermission : true)

  const deleteConfirm = useConfirmDelete(tableName, refetch, primaryKeyColumn)

  // --- Pagination change handler ---
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPaginationState(prev =>
        typeof updater === 'function' ? updater(prev) : updater
      )
    },
    []
  )

  // --- Sorting change handler ---
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      setSortingState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        // Reset to page 0 when sort changes
        setPaginationState(p => ({ ...p, pageIndex: 0 }))
        return next
      })
    },
    []
  )

  // --- Global filter change handler ---
  const handleGlobalFilterChange = useCallback((value: string | object) => {
    const strValue = typeof value === 'string' ? value : ''
    setGlobalFilterState(strValue)
    // Reset to page 0 when search changes
    setPaginationState(p => ({ ...p, pageIndex: 0 }))
  }, [])

  // --- Column definitions from metadata ---
  const columns = useMemo((): DataTableColumnDef<RecordType>[] => {
    const cols: DataTableColumnDef<RecordType>[] = []
    if (!metadata.properties) return cols

    for (const [key, property] of Object.entries(metadata.properties)) {
      if (excludeColumns.includes(key)) continue
      if (key.startsWith('_') || key.endsWith('_at')) continue
      if (key.includes('[[Prototype]]')) continue

      const variant = getFilterVariant(property)
      const columnTitle = property.title || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

      // Build options for enum / reference fields
      const options = property.enum
        ? property.enum.map(v => ({ label: v, value: v }))
        : undefined

      cols.push({
        accessorKey: key,
        enableColumnFilter: true,
        meta: {
          label: columnTitle,
          variant,
          ...(options ? { options } : {}),
        },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle>{columnTitle}</DataTableColumnTitle>
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const value = row.original[key]

          // Foreign key reference - show label from _label embedded field
          if (property.reference_table && property.reference_table_label_column) {
            const labelKey = `${key}_label`
            const embedded = row.original[labelKey] as Record<string, unknown> | undefined
            if (embedded && typeof embedded === 'object' && !Array.isArray(embedded)) {
              const labelValue = embedded[property.reference_table_label_column]
              return <div>{String(labelValue || value || '-')}</div>
            }
            return <div>{String(value || '-')}</div>
          }

          if (property.type === 'boolean') {
            return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>
          }

          if (property.enum && Array.isArray(property.enum)) {
            const sv = String(value || 'unknown')
            return (
              <Badge variant={sv === 'active' ? 'default' : sv === 'inactive' ? 'secondary' : 'outline'}>
                {sv}
              </Badge>
            )
          }

          if (property.type === 'integer' || property.type === 'number') {
            return <div className="text-right">{String(value ?? '0')}</div>
          }

          return <div>{String(value ?? '-')}</div>
        },
      })
    }

    // Actions column
    cols.push({
      id: 'actions',
      header: '',
      size: 50,
      enableHiding: false,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const recordId = row.original[primaryKeyColumn]
        const displayValue = row.original[displayColumn]
        const record = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={e => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {effectiveCanEdit ? (
                <>
                  {onEdit && editRoute && (
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(record) }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit in Sidebar
                    </DropdownMenuItem>
                  )}
                  {onEditModal && (
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onEditModal(record) }}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Edit in Modal
                    </DropdownMenuItem>
                  )}
                  {(onEdit || onEditModal) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={e => {
                      e.stopPropagation()
                      deleteConfirm.showConfirmation(
                        recordId as string | number,
                        String(displayValue || recordId || 'this record')
                      )
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No actions available</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })

    return cols
  }, [metadata, excludeColumns, effectiveCanEdit, onEdit, editRoute, onEditModal, deleteConfirm, primaryKeyColumn, displayColumn])

  // Combine external filters (URL-based sorting/pagination) with column filters from niko-table
  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters(prev =>
        typeof updater === 'function' ? updater(prev) : updater
      )
    },
    []
  )

  const tableData = useMemo(() => data ?? [], [data])

  // Show empty state only on first page with no data
  if (!isLoading && tableData.length === 0 && pagination.pageIndex === 0 && !globalFilter && columnFilters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        {_emptyIcon || <div className="h-12 w-12 mb-2" />}
        <p>{emptyMessage || 'No records found'}</p>
      </div>
    )
  }

  return (
    <>
      <DataTableRoot<RecordType, unknown>
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        state={{
          pagination,
          sorting,
          globalFilter,
          columnFilters,
        }}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onColumnFiltersChange={handleColumnFiltersChange}
        config={{
          manualPagination: true,
          manualSorting: true,
          manualFiltering: false,
          enablePagination: true,
          enableFilters: true,
          enableSorting: true,
          pageCount: totalPages ?? -1,
        }}
      >
        {/* Toolbar */}
        <DataTableToolbarSection className="justify-between">
          <div className="flex gap-2">
            <DataTableSearchFilter placeholder={`Search ${tableMetadata.plural_label?.toLowerCase() || 'records'}...`} />
          </div>
          <div className="flex gap-2">
            <DataTableSortMenu />
            <DataTableFilterMenu />
            <DataTableViewMenu />
          </div>
        </DataTableToolbarSection>

        {/* Table */}
        <DataTable>
          <DataTableHeader />
          <DataTableBody<RecordType>
            onRowClick={onRowClick}
          />
          <DataTableEmptyBody />
        </DataTable>

        {/* Pagination */}
        <DataTablePagination
          totalCount={totalCount}
          pageSizeOptions={[10, 15, 20, 25, 30, 40, 50]}
          isLoading={isLoading}
        />
      </DataTableRoot>

      <ConfirmDeleteDialog
        {...deleteConfirm}
        entityType={metadata.table?.singular_label || metadata.title || 'Record'}
      />
    </>
  )
}
