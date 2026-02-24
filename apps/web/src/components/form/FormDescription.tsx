interface FormDescriptionProps {
  description?: string
}

export function FormDescription({ description }: FormDescriptionProps) {
  if (!description) return null
  
  return (
    <p className="text-[0.8rem] text-muted-foreground">{description}</p>
  )
}
