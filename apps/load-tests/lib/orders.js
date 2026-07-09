import { REST_BASE, apiGet, randomInt } from './http.js'

// Column projection copied verbatim from the endpoint under test.
const SELECT = [
  'id',
  'ship_name',
  'customer_id',
  'customer_id_label',
  'employee_id',
  'employee_id_label',
  'ship_via',
  'ship_via_label',
  'ship_address',
  'ship_city',
  'ship_region',
  'ship_postal_code',
  'ship_country',
  'freight',
  'order_date',
  'required_date',
  'shipped_date',
  'created_at',
  'updated_at',
].join(',')

export const PAGE_SIZE = 10
export const MAX_PAGE = 80 // pages 1..80 → offsets 0..790

// Order ids in this dataset run ~10250..11000 (Northwind-style). Single-row lookup by id.
const ORDER_ID_MIN = 10250
const ORDER_ID_MAX = 11000

// List query: a random page (1..MAX_PAGE) of orders, newest first.
// page 1 → offset 0 (matches (page-1)*PAGE_SIZE).
export function getRandomOrdersPage(token) {
  const page = randomInt(1, MAX_PAGE)
  const offset = (page - 1) * PAGE_SIZE
  const url =
    `${REST_BASE}/orders?select=${SELECT}` + `&limit=${PAGE_SIZE}&offset=${offset}&order=id.desc`
  return apiGet(token, url, 'orders-list')
}

// Point lookup: a single order by a random id in [10250, 11000], e.g. orders?id=eq.10260.
export function getRandomOrderById(token) {
  const id = randomInt(ORDER_ID_MIN, ORDER_ID_MAX)
  return apiGet(token, `${REST_BASE}/orders?id=eq.${id}`, 'order')
}
