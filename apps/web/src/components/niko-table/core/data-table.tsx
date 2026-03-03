"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Table } from "@/components/ui/table"

/**
 * Extracts height from Tailwind arbitrary values (e.g., h-[600px], max-h-[400px]).
 * Converts them to inline styles to ensure scroll events work reliably.
 * For other height utilities, use the height/maxHeight props directly.
 */
function parseHeightFromClassName(className?: string) {
  if (!className)
    return { height: undefined, maxHeight: undefined, safeClassName: className }

  const classes = className.split(/\s+/)
  let height: string | undefined
  let maxHeight: string | undefined
  const remainingClasses: string[] = []

  for (const cls of classes) {
    // Match arbitrary values: h-[600px], max-h-[400px]
    const heightMatch = cls.match(/^h-\[([^\]]+)\]$/)
    const maxHeightMatch = cls.match(/^max-h-\[([^\]]+)\]$/)

    if (heightMatch) {
      height = heightMatch[1]
    } else if (maxHeightMatch) {
      maxHeight = maxHeightMatch[1]
    } else {
      remainingClasses.push(cls)
    }
  }

  return {
    height,
    maxHeight,
    safeClassName: remainingClasses.join(" "),
  }
}

export interface DataTableContainerProps {
  children: React.ReactNode
  className?: string
  height?: number | string
  maxHeight?: number | string
  /**
   * Constrain the table container to max-w-[800px].
   * Use for grids with a small number of columns (≤ 5) to prevent them
   * from stretching across the full page width.
   */
  constrained?: boolean
  /**
   * Switch the inner <table> to table-layout:fixed so that columns with
   * the truncate class properly clip overflow text.
   * Enable when any column uses width bucket 'w' (wide/long content).
   */
  truncating?: boolean
}

/**
 * DataTable container component that wraps the table and provides scrolling behavior.
 *
 * @example
 * Without height - table grows with content, no scroll
 * <DataTable>
 *   <DataTableHeader />
 *   <DataTableBody />
 * </DataTable>
 *
 * @example
 * With height prop - enables scrolling and scroll event callbacks
 * <DataTable height={600}>
 *   <DataTableHeader />
 *   <DataTableBody
 *     onScroll={(e) => console.log(`Scrolled ${e.percentage}%`)}
 *     onScrolledBottom={() => console.log('Load more data')}
 *   />
 * </DataTable>
 *
 * @example
 * With arbitrary height in className - automatically extracted and applied as inline style
 * <DataTable className="h-[600px]">
 *   <DataTableBody onScroll={...} />
 * </DataTable>
 *
 * @example
 * Prefer using height prop for better type safety and clarity
 * <DataTable height="600px" className="rounded-lg">
 *   <DataTableBody onScroll={...} />
 * </DataTable>
 */
export function DataTable({
  children,
  className,
  height,
  maxHeight,
  constrained,
  truncating,
}: DataTableContainerProps) {
  // Parse height from className if not provided via props
  const parsed = React.useMemo(
    () => parseHeightFromClassName(className),
    [className],
  )

  const finalHeight = height ?? parsed.height
  const finalMaxHeight = maxHeight ?? parsed.maxHeight ?? finalHeight

  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-auto rounded-lg border",
        constrained && "max-w-[800px]",
        // Custom scrollbar styling to match ScrollArea aesthetic
        // Scrollbar visible but subtle by default, more prominent on hover
        "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40",
        "hover:[&::-webkit-scrollbar-thumb]:bg-border",
        "[&::-webkit-scrollbar-thumb:hover]:bg-border/80!",
        // Firefox scrollbar styling
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40",
        "hover:scrollbar-thumb-border",
        parsed.safeClassName,
      )}
      style={{
        height: finalHeight,
        maxHeight: finalMaxHeight,
      }}
    >
      <Table className={truncating ? "table-fixed w-full" : undefined}>{children}</Table>
    </div>
  )
}

DataTable.displayName = "DataTable"
