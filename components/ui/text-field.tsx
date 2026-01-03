import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-[11px] tracking-wide text-muted font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-input py-2.5 px-3 text-sm text-primary rounded-lg",
            "border border-transparent",
            "outline-none transition-all",
            "placeholder:text-muted",
            "focus:border-white/[0.08]",
            error && "border-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

TextField.displayName = "TextField"

