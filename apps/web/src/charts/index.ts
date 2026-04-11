import type { ChartDefinition } from 'drizzle-cube/client'
import CustomTableChart from './CustomTableChart'
import { dataTableConfig } from './CustomTableChart.config'

/**
 * Custom chart definitions to pass to CubeProvider.
 *
 * The 'table' type overrides the built-in Data Table chart.
 * The original built-in is backed up internally by drizzle-cube
 * and restored automatically if this override is unregistered.
 *
 * Usage:
 *   import { customCharts } from './charts'
 *
 *   <CubeProvider customCharts={customCharts} ...>
 *     <App />
 *   </CubeProvider>
 */
export const customCharts: ChartDefinition[] = [
  {
    type: 'table',
    label: dataTableConfig.label || 'Data Table',
    config: dataTableConfig,
    component: CustomTableChart,
  },
]
