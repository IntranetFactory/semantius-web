import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteRecord } from './useTableMutations'

export interface DeleteConfirmation {
  id: string | number
  displayName: string
}

/**
 * Hook for handling delete confirmations with mutation
 * 
 * @param tableName - Name of the PostgREST table
 * @param onSuccess - Optional callback after successful delete
 * @param idField - Name of the primary key field (default: 'id')
 * @returns Object with state and handlers for delete confirmation dialog
 * 
 * @example
 * const deleteConfirm = useConfirmDelete('customers', refetch)
 * 
 * // For tables with non-standard primary key:
 * const deleteConfirm = useConfirmDelete('customers', refetch, 'email')
 * 
 * // In your delete button:
 * onClick={() => deleteConfirm.showConfirmation(customer.id, customer.email)}
 * 
 * // In your JSX:
 * <ConfirmDeleteDialog {...deleteConfirm} entityType="Customer" />
 */
export function useConfirmDelete(tableName: string, onSuccess?: () => void, idField?: string, singularLabel?: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DeleteConfirmation | null>(null)
  const deleteMutation = useDeleteRecord(tableName, idField)

  const showConfirmation = (id: string | number, displayName: string) => {
    deleteMutation.reset()
    setItemToDelete({ id, displayName })
    setIsOpen(true)
  }

  const handleConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      await deleteMutation.mutateAsync(itemToDelete.id)
      setIsOpen(false)
      const deletedName = itemToDelete.displayName
      setItemToDelete(null)
      onSuccess?.()
      toast.success(`${singularLabel ? singularLabel + ' ' : ''}${deletedName} deleted`)
    } catch (error) {
      console.error('Delete failed:', error)
      // Keep dialog open on error so user can retry
    }
  }

  const handleCancel = () => {
    if (!deleteMutation.isPending) {
      setIsOpen(false)
      setItemToDelete(null)
    }
  }

  return {
    isOpen,
    displayName: itemToDelete?.displayName || '',
    isPending: deleteMutation.isPending,
    error: deleteMutation.error,
    showConfirmation,
    handleConfirm,
    handleCancel,
    setIsOpen: (open: boolean) => {
      if (!deleteMutation.isPending) {
        setIsOpen(open)
        if (!open) {
          setItemToDelete(null)
        }
      }
    },
  }
}
