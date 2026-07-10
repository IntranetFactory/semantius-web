import { REST_BASE, randomInt } from './http.js'

// Product ids in this dataset run 1..75. Point lookup by a random id, e.g. products?id=eq.42.
const PRODUCT_ID_MIN = 1
const PRODUCT_ID_MAX = 75

export function productRequest() {
  const id = randomInt(PRODUCT_ID_MIN, PRODUCT_ID_MAX)
  return { method: 'GET', url: `${REST_BASE}/products?id=eq.${id}` }
}
