import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  /** Override the auto-generated segments with custom ones */
  segments?: BreadcrumbSegment[]
  /** The display name for the last segment (e.g., record name) */
  currentPage?: string
}

/**
 * Reusable breadcrumb component that generates navigation breadcrumbs from URL path.
 * First segment is treated as the module name.
 *
 * Example: /crm/customers/70/view → CRM > Customers > 70
 * With currentPage="Acme Inc" → CRM > Customers > Acme Inc
 */
export function PageBreadcrumb({ segments, currentPage }: PageBreadcrumbProps) {
  if (!segments || segments.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const label = isLast && currentPage ? currentPage : segment.label

          return (
            <BreadcrumbItem key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : segment.href ? (
                <BreadcrumbLink asChild>
                  <Link to={segment.href}>{label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Build breadcrumb segments from a URL pathname.
 * Strips trailing segments like "view" or "edit" that are mode indicators.
 *
 * @param pathname - The current URL pathname (e.g., "/crm/customers/70/view")
 * @param labels - Optional map of path segments to display labels (e.g., { crm: "CRM", customers: "Customers" })
 * @returns Array of BreadcrumbSegment objects
 */
export function buildBreadcrumbSegments(
  pathname: string,
  labels?: Record<string, string>,
): BreadcrumbSegment[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return []

  // Remove trailing mode segments (view, edit, new)
  const modeSuffixes = ['view', 'edit', 'new']
  const cleanParts = modeSuffixes.includes(parts[parts.length - 1])
    ? parts.slice(0, -1)
    : [...parts]

  const segments: BreadcrumbSegment[] = []
  let currentPath = ''

  for (let i = 0; i < cleanParts.length; i++) {
    const part = cleanParts[i]
    currentPath += `/${part}`
    const isLast = i === cleanParts.length - 1

    // Use custom label or format the segment name
    const label = labels?.[part] ?? formatSegmentLabel(part, i)

    segments.push({
      label,
      href: isLast ? undefined : currentPath,
    })
  }

  return segments
}

/** Capitalize first letter of each word, treating hyphens/underscores as word separators */
function formatSegmentLabel(segment: string, index: number): string {
  // First segment (module) is uppercased
  if (index === 0) return segment.toUpperCase()
  // Others: title case
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
