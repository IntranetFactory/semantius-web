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
import { getModuleDisplay } from '@/contexts/AuthContext'

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
  /** Optional specific parent record label (e.g. "sales@test.com") */
  parentRecordLabel?: string
  /** Optional link target for the specific parent record breadcrumb item */
  parentRecordPath?: string
}

export function EntityBreadcrumb({
  moduleId,
  entityLabel,
  entityPath,
  recordLabel,
  parentLabel,
  parentPath,
  parentRecordLabel,
  parentRecordPath,
}: EntityBreadcrumbProps) {
  const { rpcUserInfo } = useAuth()

  // Look up the module by slug and use displayName for breadcrumb label
  const { moduleLabel, moduleHomePath } = useMemo(() => {
    const moduleIdLower = moduleId.toLowerCase()
    const found = rpcUserInfo?.modules?.find((m) => m.module_slug.toLowerCase() === moduleIdLower)
    const label = found
      ? getModuleDisplay(found).displayName
      : moduleId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    const homePath = found?.home_page || `/${moduleId}`
    return { moduleLabel: label, moduleHomePath: homePath }
  }, [moduleId, rpcUserInfo?.modules])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={moduleHomePath} />}>{moduleLabel}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {parentLabel && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={parentPath || '/'} />}>{parentLabel}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {parentRecordLabel && parentRecordPath && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={parentRecordPath} />}>{parentRecordLabel}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          {recordLabel ? (
            <BreadcrumbLink render={<Link to={entityPath} />}>{entityLabel}</BreadcrumbLink>
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
