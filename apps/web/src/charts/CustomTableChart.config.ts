import type { ChartTypeConfig } from 'drizzle-cube/client'

export const dataTableConfig: ChartTypeConfig = {
  label: 'Data Table',
  description: 'Sortable tabular display of query results',
  useCase: 'Best for exploring raw data and detailed breakdowns',
  dropZones: [
    {
      key: 'xAxis',
      label: 'Columns',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop fields to choose columns (or show all)',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'pivotTimeDimension',
      label: 'Pivot Time Dimension',
      type: 'boolean',
      defaultValue: true,
      description: 'Show time periods as columns when a time dimension is present',
    },
    {
      key: 'leftYAxisFormat',
      label: 'Number Format',
      type: 'axisFormat',
    },
  ],
}
