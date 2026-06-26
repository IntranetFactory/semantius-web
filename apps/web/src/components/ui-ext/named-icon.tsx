import { DynamicIcon } from 'lucide-react/dynamic'
import type { LucideProps } from 'lucide-react'

interface NamedIconProps extends LucideProps {
  name: string | null | undefined
}

export function NamedIcon({ name, ...props }: NamedIconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <DynamicIcon name={(name || 'form') as any} {...props} />
}
