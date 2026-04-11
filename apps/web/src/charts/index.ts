import type { ChartDefinition } from 'drizzle-cube/client'
import CustomTableChart from './CustomTableChart'
import { dataTableConfig } from './CustomTableChart.config'

/**
 * Custom chart definitions to pass to CubeProvider.
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
    type: 'customTableChart',
    label: dataTableConfig.label || 'Custom Table Chart',
    config: dataTableConfig,
    component: CustomTableChart,
  },
]
