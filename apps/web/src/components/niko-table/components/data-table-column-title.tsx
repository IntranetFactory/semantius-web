"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { useDataTable } from "../core"
import { TableColumnTitle } from "../filters/table-column-title"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Renders the column title using context.
 *
 * When the column is sortable the title becomes clickable and drives sorting:
 *
 * 1. Cursor is a pointer to signal interactivity.
 * 2. Single-sort active (≤1 sorted column): clicking cycles this column
 *    asc → desc → none, replacing any existing single sort. Holding Shift adds
 *    the column as an additional sort instead of replacing.
 * 3. Multi-sort active (>1 sorted columns) and the clicked column IS sorted:
 *    toggle asc ↔ desc, preserving the other sorts.
 * 4. Multi-sort active and the clicked column is NOT sorted: open the sort
 *    dropdown (same menu the sort icon opens) so the user can place it.
 */
export function DataTableColumnTitle<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnTitle>, "column">,
) {
  const { column, setSortMenuOpen } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  const canSort = column.getCanSort()

  const handleClick = (e: React.MouseEvent) => {
    if (!canSort) return

    const sortCount = table.getState().sorting.length
    const sortState = column.getIsSorted() // false | "asc" | "desc"
    const canMultiSort = column.getCanMultiSort()
    const shift = e.shiftKey && canMultiSort

    // Shift always adds/toggles this column as an extra sort (case 2 variant).
    if (shift) {
      column.toggleSorting(undefined, true)
      return
    }

    // Case 2: single-sort mode — cycle asc → desc → none on this column only,
    // replacing whatever single sort was active.
    if (sortCount <= 1) {
      if (sortState === "asc") {
        column.toggleSorting(true, false)
      } else if (sortState === "desc") {
        column.clearSorting()
      } else {
        column.toggleSorting(false, false)
      }
      return
    }

    // Case 3: multi-sort and this column is already sorted — toggle direction
    // while keeping the other sorts intact.
    if (sortState) {
      column.toggleSorting(sortState === "asc", true)
      return
    }

    // Case 4: multi-sort and this column is unsorted — open the sort dropdown.
    setSortMenuOpen(true)
  }

  return (
    <TableColumnTitle
      column={column}
      {...props}
      onClick={canSort ? handleClick : undefined}
      className={cn(canSort && "cursor-pointer select-none", props.className)}
    />
  )
}

DataTableColumnTitle.displayName = "DataTableColumnTitle"
