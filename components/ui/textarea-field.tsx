import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm tracking-wide text-muted font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-input py-2.5 px-3 text-sm text-primary rounded-lg",
            "border border-transparent resize-none",
            "outline-none transition-all",
            "placeholder:text-muted",
            "focus:border-white/[0.08]",
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

TextareaField.displayName = "TextareaField"

