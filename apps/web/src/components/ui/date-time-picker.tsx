import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date
  onDateTimeChange?: (date: Date | undefined) => void
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

export function DateTimePicker({
  date,
  onDateTimeChange,
  disabled = false,
  readOnly = false,
  className,
}: DateTimePickerProps) {
  const [timeValue, setTimeValue] = React.useState(
    date ? format(date, "HH:mm") : ""
  )

  React.useEffect(() => {
    if (date) {
      setTimeValue(format(date, "HH:mm"))
    } else {
      setTimeValue("")
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      // Keep existing time if we have one
      if (date) {
        newDate.setHours(date.getHours())
        newDate.setMinutes(date.getMinutes())
        newDate.setSeconds(date.getSeconds())
      } else if (timeValue) {
        const [hours, minutes] = timeValue.split(':').map(Number)
        newDate.setHours(hours || 0)
        newDate.setMinutes(minutes || 0)
      }
      onDateTimeChange?.(newDate)
    } else {
      onDateTimeChange?.(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTimeValue(value)
    
    // Parse time in format HH:mm
    const [hours, minutes] = value.split(':').map(Number)
    if (!isNaN(hours) && !isNaN(minutes)) {
      const newDate = date ? new Date(date) : new Date()
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
      newDate.setSeconds(0)
      onDateTimeChange?.(newDate)
    }
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="grid gap-2 flex-1">
        <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Date
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                readOnly && "opacity-60"
              )}
              disabled={disabled || readOnly}
              tabIndex={readOnly ? -1 : undefined}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-2 flex-1">
        <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Time
        </div>
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}
