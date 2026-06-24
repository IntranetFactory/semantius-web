import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholder for the dynamic entity views (Suspense fallback in
 * _app.$moduleId.$table_name). Mirrors the real View layout — breadcrumb,
 * title + description with an action button, the search/sort/filter/view
 * toolbar, and a header-plus-rows table — so the page doesn't visibly jump
 * when the actual content swaps in.
 */
export function ViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-4 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>

      {/* Title + description + primary action */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Toolbar: search + sort/filter/view */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b pb-3">
          {SKELETON_COLUMNS.map((width, i) => (
            <Skeleton key={i} className={`h-4 rounded-md ${width}`} />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 py-2">
            {SKELETON_COLUMNS.map((width, i) => (
              <Skeleton key={i} className={`h-5 rounded-md ${width}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Column widths roughly matching a typical entity grid (label, id, a few
// text/badge columns). Shared between the header and body rows so they align.
const SKELETON_COLUMNS = [
  'w-40',
  'w-12',
  'w-56',
  'w-40',
  'w-32',
  'w-24',
] as const
