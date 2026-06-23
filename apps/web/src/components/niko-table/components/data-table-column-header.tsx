import React from "react"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"

// ============================================================================
// CONTEXT
// ============================================================================

interface TableColumnHeaderContextValue<TData, TValue> {
  column: Column<TData, TValue>
  /** Whether the column's sort dropdown menu is open. */
  sortMenuOpen: boolean
  /** Open/close the column's sort dropdown menu. */
  setSortMenuOpen: (open: boolean) => void
}

const TableColumnHeaderContext = React.createContext<
  TableColumnHeaderContextValue<unknown, unknown> | undefined
>(undefined)

export function useColumnHeaderContext<TData, TValue>(
  required: true,
): TableColumnHeaderContextValue<TData, TValue>
export function useColumnHeaderContext<TData, TValue>(
  required: false,
): TableColumnHeaderContextValue<TData, TValue> | undefined
export function useColumnHeaderContext<TData, TValue>(required = true) {
  const context = React.useContext(TableColumnHeaderContext) as
    | TableColumnHeaderContextValue<TData, TValue>
    | undefined

  if (required && !context) {
    throw new Error(
      "useColumnHeaderContext must be used within DataTableColumnHeaderRoot",
    )
  }
  return context
}

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

/**
 * Provider for column header context.
 * Used internally by DataTableHeader to provide context to composable header components.
 */
export function DataTableColumnHeaderRoot<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>
  children: React.ReactNode
}) {
  // Sort-menu open state is lifted here so the column title (case 4 below) can
  // open the same dropdown that the sort icon owns.
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false)
  return (
    <TableColumnHeaderContext.Provider
      value={
        {
          column,
          sortMenuOpen,
          setSortMenuOpen,
        } as TableColumnHeaderContextValue<unknown, unknown>
      }
    >
      {children}
    </TableColumnHeaderContext.Provider>
  )
}

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export type DataTableColumnHeaderProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Composable Column Header container.
 */
export function DataTableColumnHeader({
  className,
  children,
  ...props
}: DataTableColumnHeaderProps) {
  return (
    <div
      className={cn(
        "group flex w-full items-center justify-between gap-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

DataTableColumnHeaderRoot.displayName = "DataTableColumnHeaderRoot"
DataTableColumnHeader.displayName = "DataTableColumnHeader"
