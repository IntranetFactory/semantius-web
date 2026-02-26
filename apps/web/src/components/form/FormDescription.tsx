interface FormDescriptionProps {
  description?: string
}

export function FormDescription({ description }: FormDescriptionProps) {
  return (
    <p className="text-[0.8rem] text-muted-foreground">{description || '\u00A0'}</p>
  )
}
