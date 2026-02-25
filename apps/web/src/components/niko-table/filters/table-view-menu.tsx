import type { Column, Table } from "@tanstack/react-table"
import { Check, ChevronsUpDown, Settings2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatLabel } from "../lib/format"

/**
 * Derives the display title for a column.
 * Priority: column.meta.label > formatted column.id
 */
function getColumnTitle<TData>(column: Column<TData, unknown>): string {
  return column.columnDef.meta?.label ?? formatLabel(column.id)
}

export interface TableViewMenuProps<TData> {
  table: Table<TData>
  className?: string
  onColumnVisibilityChange?: (columnId: string, isVisible: boolean) => void
}

export function TableViewMenu<TData>({
  table,
  onColumnVisibilityChange,
}: TableViewMenuProps<TData>) {
  /**
   * PERFORMANCE: Memoize filtered columns to avoid recalculating on every render.
   *
   * WHY `table.options.columns` is in the dep array:
   * TanStack Table mutates the same `table` object reference across renders — so
   * `[table]` alone never triggers a recompute when navigating to a different table
   * (e.g. Products → Product Categories). `table.options.columns` is the ColumnDef
   * array passed to `useReactTable`; DataTableRoot recreates this array (via its own
   * `useMemo`) whenever the active table changes, giving us a new reference here.
   *
   * NOTE: TanStack's `Table` type has no `table_name` or similar identity property —
   * `options.columns` is the correct API-stable way to detect a column set change.
   */
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          column =>
            typeof column.accessorFn !== "undefined" && column.getCanHide(),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, table.options.columns],
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 />
          View
          <ChevronsUpDown className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {columns.map(column => (
                <CommandItem
                  key={column.id}
                  onSelect={() => {
                    const newVisibility = !column.getIsVisible()
                    column.toggleVisibility(newVisibility)
                    onColumnVisibilityChange?.(column.id, newVisibility)
                  }}
                >
                  <span className="truncate">{getColumnTitle(column)}</span>
                  <Check
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      column.getIsVisible() ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableViewMenu.displayName = "TableViewMenu"
