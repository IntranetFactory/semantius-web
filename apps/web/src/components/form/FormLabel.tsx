import { Label } from '@/components/ui/label'

interface FormLabelProps {
  htmlFor: string
  label?: string
  required?: boolean
  error?: boolean
}

export function FormLabel({ htmlFor, label, required, error }: FormLabelProps) {
  if (!label) return null
  
  return (
    <Label htmlFor={htmlFor} className={error ? 'text-destructive' : ''}>
      {label}{required && <>&nbsp;<span className="text-destructive">*</span></>}
    </Label>
  )
}
