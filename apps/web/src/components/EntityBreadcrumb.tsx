import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAuth } from '@/hooks/useAuth'

interface EntityBreadcrumbProps {
  /** Module name (first URL segment, e.g. "crm") */
  moduleId: string
  /** Entity plural label (e.g. "Customers") */
  entityLabel: string
  /** Path to the entity list (e.g. "/crm/customers") */
  entityPath: string
  /** Display label for the current record, or "New" for creation */
  recordLabel?: string
  /** Optional parent entity label shown between module and entity (e.g. "Users") */
  parentLabel?: string
  /** Optional link target for the parent entity breadcrumb item */
  parentPath?: string
}

export function EntityBreadcrumb({
  moduleId,
  entityLabel,
  entityPath,
  recordLabel,
  parentLabel,
  parentPath,
}: EntityBreadcrumbProps) {
  const { rpcUserInfo } = useAuth()

  // Look up the actual module name (e.g. "CRM") from user's module list
  const moduleLabel = useMemo(() => {
    const moduleIdLower = moduleId.toLowerCase()
    const found = rpcUserInfo?.modules?.find((m) => {
      const nameLower = m.module_name.toLowerCase()
      const aliasLower = m.alias?.toLowerCase()
      return (
        nameLower === moduleIdLower ||
        (aliasLower && aliasLower.trim() !== '' && aliasLower === moduleIdLower)
      )
    })
    return (
      found?.module_name ||
      moduleId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
  }, [moduleId, rpcUserInfo?.modules])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={entityPath}>{moduleLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {parentLabel && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={parentPath || '/'}>{parentLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
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
