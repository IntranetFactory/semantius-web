"use client"

import React from "react"
import type { Column } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useDerivedColumnTitle } from "../hooks"

/**
 * Renders the column title.
 */
export function TableColumnTitle<TData, TValue>({
  column,
  title,
  className,
  children,
  onClick,
}: {
  column: Column<TData, TValue>
  title?: string
  className?: string
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}) {
  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  return (
    <div
      onClick={onClick}
      className={cn(
        "truncate py-0.5 text-sm font-semibold transition-colors",
        className,
      )}
    >
      {children ?? derivedTitle}
    </div>
  )
}

TableColumnTitle.displayName = "TableColumnTitle"
