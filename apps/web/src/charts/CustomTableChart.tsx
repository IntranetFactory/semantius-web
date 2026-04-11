/**
 * Custom Data Table chart component — overrides the built-in table chart.
 *
 * Scaffolded via `npx drizzle-cube charts init --from table` and adapted
 * to use only public drizzle-cube/client exports.
 *
 * Supports:
 *  - Flat table rendering with configurable column order
 *  - Time dimension pivoting (time periods as columns)
 *  - Axis format configuration for numeric values
 */

import React, { useMemo } from 'react'
import { useCubeMeta, getMeasureTypeIcon } from 'drizzle-cube/client'
import {
  hasTimeDimensionForPivot,
  pivotTableData,
  getMeasureType,
  getOrderedColumnsFromQuery,
  formatAxisValue,
} from 'drizzle-cube/client/utils'
import type {
  PivotedTableData,
  PivotColumn,
  PivotRow,
} from 'drizzle-cube/client/utils'
import type {
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
} from 'drizzle-cube/client'

/**
 * ChartProps — mirrors the drizzle-cube ChartProps interface.
 * Defined locally because v0.4.x does not export it from the public API.
 */
interface ChartProps {
  data: any[]
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  queryObject?: CubeQuery
  height?: string | number
  colorPalette?: { colors?: string[]; gradients?: string[] }
  onDataPointClick?: (event: any) => void
  drillEnabled?: boolean
}

interface AxisFormatConfig {
  label?: string
  unit?: 'currency' | 'percent' | 'number' | 'custom'
  abbreviate?: boolean
  decimals?: number
  customPrefix?: string
  customSuffix?: string
}

const CustomTableChart = React.memo(function CustomTableChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = 300,
}: ChartProps) {
  const { getFieldLabel, meta } = useCubeMeta()

  // Detect if we should pivot based on query structure
  const pivotConfig = useMemo(
    () => hasTimeDimensionForPivot(queryObject, chartConfig?.xAxis),
    [queryObject, chartConfig?.xAxis],
  )

  // Check if pivoting is enabled (default: true when time dimension present)
  const enablePivot = displayConfig?.pivotTimeDimension !== false

  // Compute pivoted data if applicable
  const pivotedData = useMemo<PivotedTableData | null>(() => {
    if (!pivotConfig || !enablePivot) return null
    return pivotTableData(data, pivotConfig, getFieldLabel, meta)
  }, [data, pivotConfig, enablePivot, getFieldLabel, meta])

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full"
        style={{ height }}
      >
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data</div>
          <div className="dc:text-xs text-dc-text-secondary">
            Try adjusting filters or expanding the date range
          </div>
        </div>
      </div>
    )
  }

  // Render pivoted table if applicable
  if (pivotedData?.isPivoted && pivotedData.columns.length > 0) {
    return (
      <PivotedTable
        pivotedData={pivotedData}
        height={height}
        meta={meta}
        leftYAxisFormat={displayConfig?.leftYAxisFormat as AxisFormatConfig | undefined}
      />
    )
  }

  // Fallback to flat table rendering
  return (
    <FlatTable
      data={data}
      chartConfig={chartConfig}
      queryObject={queryObject}
      height={height}
      getFieldLabel={getFieldLabel}
      leftYAxisFormat={displayConfig?.leftYAxisFormat as AxisFormatConfig | undefined}
    />
  )
})

export default CustomTableChart

// ---------------------------------------------------------------------------
// Pivoted table
// ---------------------------------------------------------------------------

function PivotedTable({
  pivotedData,
  height,
  meta,
  leftYAxisFormat,
}: {
  pivotedData: PivotedTableData
  height: number | string
  meta: any
  leftYAxisFormat?: AxisFormatConfig
}) {
  const { columns, rows } = pivotedData

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full"
        style={{ height }}
      >
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data</div>
          <div className="dc:text-xs text-dc-text-secondary">
            Try adjusting filters or expanding the date range
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:w-full dc:overflow-auto" style={{ height }}>
      <table className="dc:min-w-full dc:divide-y border-dc-border">
        <thead className="bg-dc-surface-secondary dc:sticky dc:top-0">
          <tr>
            {columns.map((col: PivotColumn) => (
              <th
                key={col.key}
                className={`dc:px-3 dc:py-2 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider dc:whitespace-nowrap ${
                  col.isTimeColumn ? 'dc:text-right' : 'dc:text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-dc-surface dc:divide-y border-dc-border">
          {rows.map((row: PivotRow) => (
            <PivotedTableRow
              key={row.id}
              row={row}
              columns={columns}
              meta={meta}
              leftYAxisFormat={leftYAxisFormat}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PivotedTableRow({
  row,
  columns,
  meta,
  leftYAxisFormat,
}: {
  row: PivotRow
  columns: PivotColumn[]
  meta: any
  leftYAxisFormat?: AxisFormatConfig
}) {
  const measureType = getMeasureType(row.measureField, meta)
  const MeasureIcon = getMeasureTypeIcon(measureType)

  return (
    <tr className="hover:bg-dc-surface-secondary">
      {columns.map((col: PivotColumn) => {
        const value = row.values[col.key]

        // Measure column — show icon + label with row spanning
        if (col.isMeasureColumn) {
          if (row.isFirstInGroup === false) return null

          return (
            <td
              key={col.key}
              className="dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm text-dc-text dc:align-top"
              rowSpan={row.dimensionRowSpan}
            >
              <div className="dc:flex dc:items-center">
                <MeasureIcon className="dc:w-3.5 dc:h-3.5 dc:mr-1.5 text-dc-text-muted dc:shrink-0" />
                <span>{value}</span>
              </div>
            </td>
          )
        }

        // Time column — right-aligned, formatted values
        if (col.isTimeColumn) {
          return (
            <td
              key={col.key}
              className="dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm dc:text-right text-dc-text"
            >
              {formatPivotCellValue(value, leftYAxisFormat)}
            </td>
          )
        }

        // Dimension column — left-aligned
        return (
          <td
            key={col.key}
            className="dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm text-dc-text"
          >
            {formatPivotCellValue(value)}
          </td>
        )
      })}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Flat table
// ---------------------------------------------------------------------------

function FlatTable({
  data,
  chartConfig,
  queryObject,
  height,
  getFieldLabel,
  leftYAxisFormat,
}: {
  data: any[]
  chartConfig?: { xAxis?: string[] }
  queryObject?: ChartProps['queryObject']
  height: number | string
  getFieldLabel: (field: string) => string
  leftYAxisFormat?: AxisFormatConfig
}) {
  const allColumns = Object.keys(data[0] || {})

  const columns = useMemo(() => {
    if (chartConfig?.xAxis && chartConfig.xAxis.length > 0) {
      return chartConfig.xAxis.filter((col) => allColumns.includes(col))
    }

    const queryOrder = getOrderedColumnsFromQuery(queryObject)
    if (queryOrder.length > 0) {
      const ordered = queryOrder.filter((col) => allColumns.includes(col))
      const remaining = allColumns.filter((col) => !ordered.includes(col))
      return [...ordered, ...remaining]
    }

    return allColumns
  }, [chartConfig?.xAxis, queryObject, allColumns])

  if (columns.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full"
        style={{ height }}
      >
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">
            No columns available
          </div>
          <div className="dc:text-xs text-dc-text-secondary">
            The data structure could not be read
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:w-full dc:overflow-auto" style={{ height }}>
      <table className="dc:min-w-full dc:divide-y border-dc-border">
        <thead className="bg-dc-surface-secondary dc:sticky dc:top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider"
              >
                {getFieldLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-dc-surface dc:divide-y border-dc-border">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-dc-surface-secondary">
              {columns.map((column) => (
                <td
                  key={column}
                  className="dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm text-dc-text"
                >
                  {formatCellValue(row[column], leftYAxisFormat)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatPivotCellValue(
  value: any,
  formatConfig?: AxisFormatConfig,
): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    if (formatConfig) return formatAxisValue(value, formatConfig)
    if (Number.isInteger(value)) return value.toLocaleString()
    return parseFloat(value.toFixed(2)).toLocaleString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function formatCellValue(
  value: any,
  formatConfig?: AxisFormatConfig,
): string {
  if (value == null) return ''
  if (typeof value === 'number') {
    if (formatConfig) return formatAxisValue(value, formatConfig)
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
