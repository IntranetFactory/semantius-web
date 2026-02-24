import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ConfirmDeleteDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  displayName: string
  isPending: boolean
  handleConfirm: () => void
  handleCancel: () => void
  entityType?: string
}

/**
 * Reusable delete confirmation dialog component
 * 
 * Use with the useConfirmDelete hook for consistent delete UX
 * 
 * @example
 * const deleteConfirm = useConfirmDelete('customers', refetch)
 * return <ConfirmDeleteDialog {...deleteConfirm} entityType="Customer" />
 */
export function ConfirmDeleteDialog({
  isOpen,
  setIsOpen,
  displayName,
  isPending,
  handleConfirm,
  handleCancel,
  entityType = 'item',
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <strong>{displayName}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            variant="destructive"
            type="button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
