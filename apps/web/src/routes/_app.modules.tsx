import { createFileRoute } from '@tanstack/react-router'
import { Database, Loader2 } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { ApiErrorDisplay } from '@/components/ApiErrorDisplay'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_app/modules')({
  component: ModulesComponent,
})

function ModulesComponent() {
  const { data: modules, isLoading, error } = useTable('modules')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          Browse and manage system modules
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Modules List</CardTitle>
          </div>
          <CardDescription>
            Data fetched from PostgREST API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading modules...</span>
            </div>
          )}

          {error && (
            <ApiErrorDisplay error={error} title="Error loading modules" />
          )}

          {!isLoading && !error && modules && modules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mb-2" />
              <p>No modules found</p>
            </div>
          )}

          {!isLoading && !error && modules && modules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={String(module.module_id || Math.random())}>
                    <TableCell className="font-medium">{String(module.module_id || '-')}</TableCell>
                    <TableCell>{String(module.module_name || '-')}</TableCell>
                    <TableCell>{String(module.description || '-')}</TableCell>
                    <TableCell>
                      {module.created_at && typeof module.created_at === 'string'
                        ? new Date(module.created_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
