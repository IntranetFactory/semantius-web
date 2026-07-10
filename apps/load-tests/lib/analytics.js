// Cube.js analytics endpoint. Same bearer token as the PostgREST calls; POSTs a Cube query
// batch. Host is `https://{org}.semantius.io` where org = VITE_CONTROL_PLANE_ORG (the same
// slug the token exchange uses). Override the full URL with ANALYTICS_URL if needed.
const ORG = __ENV.VITE_CONTROL_PLANE_ORG
export const ANALYTICS_URL =
  __ENV.ANALYTICS_URL || `https://${ORG}.semantius.io/nwind/cubejs-api/v1/batch`

// One query for now: total freight by product category. Add more queries to the array (or
// more actions to the analytics profile) to grow the analytics load.
const QUERY_BODY = JSON.stringify({
  queries: [
    {
      measures: ['Orders.totalFreight'],
      dimensions: ['Products.category_id_label'],
    },
  ],
})

export function analyticsBatchRequest() {
  return { method: 'POST', url: ANALYTICS_URL, body: QUERY_BODY }
}
