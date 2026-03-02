import { useSearch } from '@tanstack/react-router'
import { useTable } from '@/hooks/useTable'
import { useCreateRecord, useUpdateRecord } from '@/hooks/useTableMutations'
import { SchemaForm } from '@/components/form/SchemaForm'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'
import { Loader2 } from 'lucide-react'
import type { EntityMetadata } from '@/types/metadata'

interface DataFormPageProps {
  schema: EntityMetadata
  recordId?: string | null
  onClose?: () => void
  formMode?: 'edit' | 'create' | 'view'
  formId?: string
  onBeforeSubmit?: (submitter: Element | null) => void
}

export function DataFormPage({ schema, recordId, onClose, formMode, formId, onBeforeSubmit }: DataFormPageProps) {
  const tableName = schema.table?.table_name
  const idColumn = schema.table?.id_column

  // Read parent-filter params from URL (_pf = "{tableName}.{columnName}", _pv = value)
  const { _pf, _pv } = useSearch({
    strict: false,
    select: (s: Record<string, unknown>) => ({
      _pf: s._pf as string | undefined,
      _pv: s._pv as string | undefined,
    }),
  })

  // Derive parent column from _pf (format: "tableName.columnName")
  const pfTable = _pf?.includes('.') ? _pf.split('.')[0] : undefined
  const pfColumn = _pf?.includes('.') ? _pf.split('.')[1] : _pf
  // Only apply if column exists in schema and table name matches (or no table prefix)
  const parentField =
    pfColumn &&
    (schema.properties as Record<string, unknown>)?.[pfColumn] !== undefined &&
    (!pfTable || pfTable === tableName)
      ? pfColumn
      : undefined

  // Determine formMode: 'create' if no recordId, 'edit' if recordId provided, or use explicit formMode
  const resolvedFormMode = formMode || (recordId ? 'edit' : 'create')

  if (!tableName) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Error: Table name not found in schema
      </div>
    )
  }

  if (!idColumn) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Error: ID column not found in schema
      </div>
    )
  }

  // Fetch record data if recordId is provided
  const { data, isLoading, error, refetch } = useTable(tableName, {
    query: recordId ? `${idColumn}=eq.${recordId}` : undefined,
    enabled: !!recordId,
  })

  // Mutation hooks for create and update
  const createRecord = useCreateRecord(tableName)
  const updateRecord = useUpdateRecord(tableName, idColumn)

  // Handle form submission
  const handleSubmit = async (value: Record<string, any>) => {
    try {
      if (recordId) {
        // Update existing record
        await updateRecord.mutateAsync({
          ...value,
          [idColumn]: recordId,
        })
      } else {
        // Create new record
        await createRecord.mutateAsync(value)
      }
      
      // Refetch data if updating
      if (recordId) {
        await refetch()
      }
      
      // Close the form
      onClose?.()
    } catch (error) {
      console.error('Failed to save record:', error)
      // Error is handled by the mutation hooks and displayed in the form
    }
  }

  // Show loading state while fetching data
  if (recordId && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show error if fetch failed
  if (recordId && error) {
    return <ApiErrorDisplay error={error} title="Error loading record" />
  }

  // Get the record data (first item in array)
  const recordData = recordId && data && data.length > 0 ? data[0] : undefined

  // Inject parent field value from _pv into the initial data (for both create and edit modes)
  // Convert to number if the field type is integer/number
  const parentFieldSchema = parentField
    ? (schema.properties as unknown as Record<string, Record<string, unknown>>)?.[parentField]
    : undefined
  const isNumericParent =
    parentFieldSchema?.type === 'integer' || parentFieldSchema?.type === 'number'
  const parentValue =
    parentField && _pv !== undefined
      ? isNumericParent
        ? (Number.isNaN(Number(_pv)) ? _pv : Number(_pv))
        : _pv
      : undefined
  const effectiveInitialValue =
    parentField && parentValue !== undefined
      ? { ...(recordData || {}), [parentField]: parentValue }
      : recordData

  return (
    <>
      <SchemaForm
        id={formId}
        onBeforeSubmit={onBeforeSubmit}
        schema={schema}
        initialValue={effectiveInitialValue}
        onSubmit={handleSubmit}
        formMode={resolvedFormMode}
        parentField={parentField}
      />

      {/* Display mutation errors */}
      {createRecord.error && (
        <div className="mt-4">
          <ApiErrorDisplay
            error={createRecord.error}
            title="Error creating record"
          />
        </div>
      )}
      {updateRecord.error && (
        <div className="mt-4">
          <ApiErrorDisplay
            error={updateRecord.error}
            title="Error updating record"
          />
        </div>
      )}
    </>
  )
}
