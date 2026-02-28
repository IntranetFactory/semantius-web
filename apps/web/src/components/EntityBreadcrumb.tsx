import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface EntityBreadcrumbProps {
  /** Module name (first URL segment, e.g. "crm") */
  moduleId: string
  /** Entity plural label (e.g. "Customers") */
  entityLabel: string
  /** Path to the entity list (e.g. "/crm/customers") */
  entityPath: string
  /** Display label for the current record, or "New" for creation */
  recordLabel?: string
}

export function EntityBreadcrumb({
  moduleId,
  entityLabel,
  entityPath,
  recordLabel,
}: EntityBreadcrumbProps) {
  const moduleLabel = moduleId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={entityPath}>{moduleLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {recordLabel ? (
            <BreadcrumbLink asChild>
              <Link to={entityPath}>{entityLabel}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{entityLabel}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {recordLabel && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{recordLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
