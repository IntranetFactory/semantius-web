import { useFormContext } from './FormContext'

interface FormDescriptionProps {
  description?: string
  error?: string
}

export function FormDescription({ description, error }: FormDescriptionProps) {
  const { formMode } = useFormContext()
  if (formMode === 'view') return null
  if (!description && error) return null
  return (
    <p className="text-[0.8rem] text-muted-foreground">{description || '\u00A0'}</p>
  )
}
