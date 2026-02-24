interface FormErrorProps {
  name: string
  error?: string
}

export function FormError({ name, error }: FormErrorProps) {
  if (!error) return null
  
  return (
    <p id={`${name}-error`} className="text-[0.8rem] font-medium text-destructive">
      {error}
    </p>
  )
}
