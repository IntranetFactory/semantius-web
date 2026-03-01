import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { FormControlProps } from './types'
import { useFormContext } from './FormContext'
import { FormLabel } from './FormLabel'
import { FormDescription } from './FormDescription'
import { FormError } from './FormError'

export function InputEnum({
  name,
  label,
  description,
  inputMode = 'default',
  validators,
  schema,
}: FormControlProps) {
  const { form } = useFormContext()
  const [open, setOpen] = useState(false)

  // Derive props from inputMode
  const required = inputMode === 'required'
  const readonly = inputMode === 'readonly'
  const disabled = inputMode === 'disabled'
  const hidden = inputMode === 'hidden'

  // Get enum values from schema prop
  const enumValues: string[] = (schema as any)?.enum || []
  const showSearch = enumValues.length > 10

  return (
    <form.Field name={name} validators={validators}>
      {(field: any) => {
        if (hidden) {
          return <input type="hidden" name={name} value={field.state.value || ''} />
        }

        const currentValue: string = field.state.value ?? ''
        const isDisabled = disabled || readonly

        const handleSelect = (selected: string) => {
          field.setMeta((meta: any) => ({
            ...meta,
            errors: [],
            errorMap: {},
          }))
          field.handleChange(selected)
          setOpen(false)
        }

        const handleClear = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          field.setMeta((meta: any) => ({
            ...meta,
            errors: [],
            errorMap: {},
          }))
          field.handleChange('')
        }

        return (
          <div className="pt-2 space-y-1">
            <FormLabel htmlFor={name} label={label} required={required} error={!!field.state.meta.errors?.[0]} />
            <Popover
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen)
                if (!isOpen) field.handleBlur()
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={!!field.state.meta.errors?.[0] || undefined}
                  aria-describedby={field.state.meta.errors?.[0] ? `${name}-error` : undefined}
                  disabled={isDisabled}
                  className={cn(
                    "group w-full cursor-pointer justify-between font-normal px-3 hover:bg-transparent hover:text-foreground dark:hover:bg-input/30",
                    !currentValue && "text-muted-foreground",
                    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive"
                  )}
                >
                  <span className="truncate">
                    {isDisabled ? (currentValue || '') : (currentValue || 'Select an option')}
                  </span>
                  <div className="flex items-center gap-1 ml-auto shrink-0 opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-aria-expanded:opacity-100 transition-opacity">
                    {!isDisabled && !required && currentValue && (
                      <span
                        role="button"
                        aria-label="Clear selection"
                        className="flex items-center justify-center"
                        onPointerDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={handleClear}
                      >
                        <X className="opacity-50 hover:opacity-100 h-3 w-3" />
                      </span>
                    )}
                    {!isDisabled && <ChevronsUpDown className="opacity-50" size={10} />}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  {showSearch && <CommandInput placeholder="Search..." />}
                  <CommandList>
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandGroup>
                      {enumValues.map((option) => (
                        <CommandItem
                          key={option}
                          value={option}
                          onSelect={handleSelect}
                          className="cursor-pointer bg-transparent! hover:bg-accent!"
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              currentValue === option ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription description={description} error={field.state.meta.errors?.[0]} />
            <FormError name={name} error={field.state.meta.errors?.[0]} />
          </div>
        )
      }}
    </form.Field>
  )
}
