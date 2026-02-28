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
import { FILTER_VARIANTS, JOIN_OPERATORS, type FilterVariant } from '@/components/niko-table/lib/constants'
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
  Eye,
  Trash2,
} from 'lucide-react'

type RecordType = Record<string, unknown>
type PlainFilter = Omit<ExtendedColumnFilter<RecordType>, 'filterId'>

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

// Convert one ExtendedColumnFilter to one or more PostgREST AND query parameters.
// Returns an array because 'between' requires two parameters.
function filterToPostgRESTParams(filter: PlainFilter): string[] {
  const col = filter.id as string
  const val = filter.value
  const op = filter.operator

  if (
    (val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0)) &&
    op !== 'empty' && op !== 'not.empty'
  ) return []

  const strVal = Array.isArray(val) ? (val[0] ?? '') : (val ?? '')

  switch (op) {
    case 'ilike':     return [`${col}=ilike.*${strVal}*`]
    case 'not.ilike': return [`${col}=not.ilike.*${strVal}*`]
    case 'eq':        return strVal !== '' ? [`${col}=eq.${strVal}`] : []
    case 'neq':       return strVal !== '' ? [`${col}=neq.${strVal}`] : []
    case 'in': {
      const vals = (Array.isArray(val) ? val : String(val).split(',')).filter(v => v !== '')
      return vals.length > 0 ? [`${col}=in.(${vals.join(',')})`] : []
    }
    case 'not.in': {
      const vals = (Array.isArray(val) ? val : String(val).split(',')).filter(v => v !== '')
      return vals.length > 0 ? [`${col}=not.in.(${vals.join(',')})`] : []
    }
    case 'empty':     return [`${col}=is.null`]
    case 'not.empty': return [`${col}=not.is.null`]
    case 'lt':        return strVal !== '' ? [`${col}=lt.${strVal}`] : []
    case 'lte':       return strVal !== '' ? [`${col}=lte.${strVal}`] : []
    case 'gt':        return strVal !== '' ? [`${col}=gt.${strVal}`] : []
    case 'gte':       return strVal !== '' ? [`${col}=gte.${strVal}`] : []
    case 'between': {
      const arr = Array.isArray(val) ? val : []
      const result: string[] = []
      if (arr[0] !== undefined && arr[0] !== '') result.push(`${col}=gte.${arr[0]}`)
      if (arr[1] !== undefined && arr[1] !== '') result.push(`${col}=lte.${arr[1]}`)
      return result
    }
    default: return []
  }
}

// Convert one filter to PostgREST dot-notation (for use inside or=(...))
function filterToORCondition(filter: PlainFilter): string | null {
  const col = filter.id as string
  const val = filter.value
  const op = filter.operator

  if (
    (val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0)) &&
    op !== 'empty' && op !== 'not.empty'
  ) return null

  const strVal = Array.isArray(val) ? (val[0] ?? '') : (val ?? '')

  switch (op) {
    case 'ilike':     return `${col}.ilike.*${strVal}*`
    case 'not.ilike': return `${col}.not.ilike.*${strVal}*`
    case 'eq':        return strVal !== '' ? `${col}.eq.${strVal}` : null
    case 'neq':       return strVal !== '' ? `${col}.neq.${strVal}` : null
    case 'in': {
      const vals = (Array.isArray(val) ? val : String(val).split(',')).filter(v => v !== '')
      return vals.length > 0 ? `${col}.in.(${vals.join(',')})` : null
    }
    case 'lt':        return strVal !== '' ? `${col}.lt.${strVal}` : null
    case 'lte':       return strVal !== '' ? `${col}.lte.${strVal}` : null
    case 'gt':        return strVal !== '' ? `${col}.gt.${strVal}` : null
    case 'gte':       return strVal !== '' ? `${col}.gte.${strVal}` : null
    case 'empty':     return `${col}.is.null`
    case 'not.empty': return `${col}.not.is.null`
    default: return null
  }
}

// Deserialize filters from URL JSON string, regenerating filterId deterministically.
// TanStack Router stores string search params as JSON-encoded strings (double-encoded),
// so we unwrap one layer if needed.
function parseFiltersFromURL(filtersParam: string | undefined): ExtendedColumnFilter<RecordType>[] {
  if (!filtersParam) return []
  try {
    let parsed = JSON.parse(filtersParam)
    // TanStack Router may have double-encoded the value: unwrap if it's still a string
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)
    if (!Array.isArray(parsed)) return []
    return (parsed as PlainFilter[]).map((f, i) => ({
      ...f,
      filterId: `url-filter-${f.id as string}-${f.operator}-${i}`,
    }))
  } catch {
    return []
  }
}

// Serialize filters for URL (strip filterId to keep URLs short)
function serializeFiltersForURL(filters: ExtendedColumnFilter<RecordType>[]): string | undefined {
  if (filters.length === 0) return undefined
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return JSON.stringify(filters.map(({ filterId: _id, ...rest }) => rest))
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

  // --- URL search params (read-only, truth comes from our state) ---
  const searchParams = useSearch({
    strict: false,
    select: (search) => ({
      page:      (search as { page?: number }).page,
      pageSize:  (search as { pageSize?: number }).pageSize,
      sortBy:    (search as { sortBy?: string }).sortBy,
      sortOrder: (search as { sortOrder?: 'asc' | 'desc' }).sortOrder,
      search:    (search as { search?: string }).search,
      filters:   (search as { filters?: string }).filters,
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

  // --- Controlled state: all owned here, synced to URL ---
  const [pagination, setPaginationState] = useState<PaginationState>(() => ({
    pageIndex: searchParams.page ? searchParams.page - 1 : 0,
    pageSize:  searchParams.pageSize || getDefaultPageSize(),
  }))

  const [sorting, setSortingState] = useState<SortingState>(() => {
    const col = searchParams.sortBy
    const exists = col && metadata.properties?.[col]
    return exists
      ? [{ id: col, desc: searchParams.sortOrder === 'desc' }]
      : [{ id: primaryKeyColumn, desc: true }]
  })

  // extFilters = all niko-table filter rows (AND + OR), server-side, in URL
  const [extFilters, setExtFilters] = useState<ExtendedColumnFilter<RecordType>[]>(
    () => parseFiltersFromURL(searchParams.filters)
  )

  // searchText = global search box, server-side (or= ilike across text cols), in URL
  const [searchText, setSearchText] = useState<string>(searchParams.search || '')

  // Reset state when the underlying table changes (navigation between routes)
  useEffect(() => {
    setPaginationState({
      pageIndex: searchParams.page ? searchParams.page - 1 : 0,
      pageSize:  searchParams.pageSize || getDefaultPageSize(),
    })
    const col = searchParams.sortBy
    const exists = col && metadata.properties?.[col]
    setSortingState(
      exists
        ? [{ id: col, desc: searchParams.sortOrder === 'desc' }]
        : [{ id: primaryKeyColumn, desc: true }]
    )
    setExtFilters(parseFiltersFromURL(searchParams.filters))
    setSearchText(searchParams.search || '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName])

  // --- Sync ALL state to URL whenever any piece changes ---
  useEffect(() => {
    const targetPage      = pagination.pageIndex + 1
    const targetPageSize  = pagination.pageSize
    const targetSortBy    = sorting[0]?.id
    const targetSortOrder = sorting[0]?.desc ? 'desc' : 'asc'
    const targetSearch    = searchText || undefined
    const targetFilters   = serializeFiltersForURL(extFilters)

    const currentPage      = searchParams.page || 1
    const currentPageSize  = searchParams.pageSize || 10
    const currentSortBy    = searchParams.sortBy
    const currentSortOrder = searchParams.sortOrder || 'asc'
    const currentSearch    = searchParams.search
    const currentFilters   = searchParams.filters

    if (
      currentPage      === targetPage      &&
      currentPageSize  === targetPageSize  &&
      currentSortBy    === targetSortBy    &&
      currentSortOrder === targetSortOrder &&
      currentSearch    === targetSearch    &&
      currentFilters   === targetFilters
    ) return

    navigate({
      search: (prev: unknown) => ({
        ...(prev as object),
        page:     targetPage,
        pageSize: targetPageSize,
        ...(targetSortBy    ? { sortBy: targetSortBy, sortOrder: targetSortOrder } : { sortBy: undefined, sortOrder: undefined }),
        ...(targetSearch    ? { search:  targetSearch  } : { search:  undefined }),
        ...(targetFilters   ? { filters: targetFilters } : { filters: undefined }),
      }),
      replace: true,
      resetScroll: false,
    } as Parameters<typeof navigate>[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, sorting, searchText, extFilters])

  // --- Build the PostgREST query (every state change triggers a new API call) ---
  const query = useMemo(() => {
    const params: string[] = []

    params.push(`select=${buildPostgRESTSelect(metadata)}`)
    params.push(`limit=${pagination.pageSize}`)
    params.push(`offset=${pagination.pageIndex * pagination.pageSize}`)

    if (sorting.length > 0) {
      params.push(`order=${sorting.map(s => `${s.id}.${s.desc ? 'desc' : 'asc'}`).join(',')}`)
    }

    // AND filters from filter menu
    const andFilters = extFilters.filter(
      f => !f.joinOperator || f.joinOperator === JOIN_OPERATORS.AND
    )
    for (const f of andFilters) {
      params.push(...filterToPostgRESTParams(f))
    }

    // OR filters from filter menu → PostgREST or=(...)
    const orFilters = extFilters.filter(f => f.joinOperator === JOIN_OPERATORS.OR)
    if (orFilters.length > 0) {
      const conditions = orFilters.map(filterToORCondition).filter(Boolean) as string[]
      if (conditions.length > 0) params.push(`or=(${conditions.join(',')})`)
    }

    // Global search box → wfts (full-text search) on search_vector column
    const trimmedSearch = searchText.trim()
    if (trimmedSearch) {
      params.push(`search_vector=wfts.${encodeURIComponent(trimmedSearch)}`)
    }

    return params.join('&')
  }, [pagination.pageIndex, pagination.pageSize, sorting, extFilters, searchText, metadata])

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

  // --- Pagination change: from niko-table pagination component ---
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPaginationState(prev =>
        typeof updater === 'function' ? updater(prev) : updater
      )
    },
    []
  )

  // --- Sorting change: resets to page 0 ---
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      setSortingState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        setPaginationState(p => ({ ...p, pageIndex: 0 }))
        return next
      })
    },
    []
  )

  // --- Controlled filter change from DataTableFilterMenu ---
  const handleFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<RecordType>[] | null) => {
      setExtFilters(filters ?? [])
      setPaginationState(p => ({ ...p, pageIndex: 0 }))
    },
    []
  )

  // --- Controlled search change from DataTableSearchFilter ---
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value)
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
    const fieldCount = Object.keys(metadata.properties || {}).length
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
        const handleOpenRecord = (e: React.MouseEvent) => {
          e.stopPropagation()
          const useModal = window.innerWidth > 900 && fieldCount >= 10
          if (useModal && onEditModal) {
            onEditModal(record)
          } else {
            (onEdit || onEditModal)?.(record)
          }
        }
        const hasOpenHandler = !!(onEdit || onEditModal)
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
              {hasOpenHandler && (
                <DropdownMenuItem onClick={handleOpenRecord}>
                  {effectiveCanEdit ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {effectiveCanEdit && hasOpenHandler && <DropdownMenuSeparator />}
              {effectiveCanEdit && (
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
              )}
              {!hasOpenHandler && !effectiveCanEdit && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No actions available</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })

    return cols
  }, [metadata, excludeColumns, effectiveCanEdit, onEdit, editRoute, onEditModal, deleteConfirm, primaryKeyColumn, displayColumn])

  const tableData = useMemo(() => data ?? [], [data])

  // Show empty state when first page is empty with no active search/filters
  if (!isLoading && tableData.length === 0 && pagination.pageIndex === 0 && !searchText && extFilters.length === 0) {
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
        }}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        config={{
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          enablePagination: true,
          enableFilters: true,
          enableSorting: true,
          pageCount: totalPages ?? -1,
        }}
      >
        {/* Toolbar */}
        <DataTableToolbarSection className="justify-between">
          <div className="flex flex-1 gap-2">
            {tableMetadata.searchable && (
              <DataTableSearchFilter
                placeholder={`Search ${tableMetadata.plural_label || 'records'}...`}
                value={searchText}
                onChange={handleSearchChange}
                className="max-w-[200px]"
              />
            )}
          </div>
          <div className="flex gap-2">
            <DataTableSortMenu />
            <DataTableFilterMenu
              filters={extFilters}
              onFiltersChange={handleFiltersChange}
            />
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
