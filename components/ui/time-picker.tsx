"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm tracking-wide text-muted font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="time"
          className={cn(
            "w-full bg-input py-2.5 px-3 text-sm text-primary rounded-lg",
            "border border-transparent",
            "outline-none transition-all",
            "focus:border-white/[0.08]",
            "[color-scheme:dark]",
            error && "border-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

TimePicker.displayName = "TimePicker"

