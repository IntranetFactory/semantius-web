import { useTable } from '@/hooks/useTable'
import { useCreateRecord, useUpdateRecord } from '@/hooks/useTableMutations'
import { SchemaForm } from './SchemaForm'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'
import { Loader2 } from 'lucide-react'
import type { EntityMetadata } from '@/types/metadata'

interface TableFormProps {
  schema: EntityMetadata
  recordId?: string | null
  onClose?: () => void
  formMode?: 'edit' | 'create' | 'view'
}

export function TableForm({ schema, recordId, onClose, formMode }: TableFormProps) {
  const tableName = schema.table?.table_name
  const idColumn = schema.table?.id_column

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

  return (
    <div className="p-6">
      <SchemaForm
        schema={schema}
        initialValue={recordData}
        onSubmit={handleSubmit}
        formMode={resolvedFormMode}
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
    </div>
  )
}
