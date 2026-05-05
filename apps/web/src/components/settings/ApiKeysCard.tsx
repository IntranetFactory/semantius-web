import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Key, Plus, Trash2, Copy, Check, Loader2 } from 'lucide-react'
import { useRpc, useRpcMutation } from '@/hooks/useRpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ApiKey {
  key_id: number
  description: string
  created_at: string
  last_used_at: string | null
}

interface CreateApiKeyResult {
  key_id: number
  api_key: string
}

export function ApiKeysCard() {
  const queryClient = useQueryClient()

  // Fetch existing API keys
  const { data: apiKeys, isLoading } = useRpc<ApiKey[]>('list_api_keys', {
    params: { p_user_id: 0 },
  })

  // Create API key mutation
  const createMutation = useRpcMutation<CreateApiKeyResult, { p_description: string }>('create_api_key', {
    onSuccess: (data) => {
      setNewApiKey(data.api_key)
      setShowNewKeyDialog(true)
      setShowNameDialog(false)
      setKeyName('')
      queryClient.invalidateQueries({ queryKey: ['rpc', 'list_api_keys'] })
    },
  })

  // Revoke API key mutation
  const revokeMutation = useRpcMutation<unknown, { p_key_id: number }>('revoke_api_key', {
    onSuccess: () => {
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['rpc', 'list_api_keys'] })
    },
  })

  // State
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)

  const handleCreate = () => {
    if (!keyName.trim()) return
    createMutation.mutate({ p_description: keyName.trim() })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newApiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    revokeMutation.mutate({ p_key_id: deleteTarget.key_id })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>API Keys</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setKeyName('')
                createMutation.reset()
                setShowNameDialog(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add new API key
            </Button>
          </div>
          <CardDescription>
            Manage API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys && apiKeys.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Created</th>
                    <th className="px-4 py-2 text-left font-medium">Last Used</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.key_id} className="border-b last:border-0">
                      <td className="px-4 py-2">{key.description}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(key)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No API keys yet. Create one to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Name prompt dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Enter a name to identify this API key.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. Production, CI/CD, Development"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            autoFocus
          />
          {createMutation.error && (
            <p className="text-sm text-destructive">
              {createMutation.error.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!keyName.trim() || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show new key dialog */}
      <Dialog
        open={showNewKeyDialog}
        onOpenChange={(open) => {
          if (!open) {
            setNewApiKey('')
          }
          setShowNewKeyDialog(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted p-3 font-mono text-xs break-all">
              {newApiKey}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewKeyDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            revokeMutation.reset()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{' '}
              <strong>{deleteTarget?.description}</strong>? This action cannot
              be undone and any integrations using this key will stop working.
            </AlertDialogDescription>
            {revokeMutation.error && (
              <p className="text-sm text-destructive pt-1">
                {revokeMutation.error.message}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={revokeMutation.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
