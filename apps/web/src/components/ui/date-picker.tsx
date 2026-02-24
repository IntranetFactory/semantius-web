import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  readOnly = false,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("relative flex gap-2 max-w-[280px]", className)}>
      <Input
        value={date ? format(date, "PPP") : ""}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        className="bg-background pr-10"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled || readOnly}
            type="button"
            tabIndex={readOnly ? -1 : undefined}
            className={cn(
              "absolute top-1/2 right-2 size-6 -translate-y-1/2",
              readOnly && "opacity-60"
            )}
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end" alignOffset={-8} sideOffset={10}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            captionLayout="dropdown"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
