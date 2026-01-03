import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive"
  size?: "sm" | "md" | "lg"
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", size = "md", className, children, ...props }, ref) => {
    const sizeClasses = {
      sm: "p-1",
      md: "p-2",
      lg: "p-3"
    }

    const variantClasses = {
      default: "text-muted hover:text-secondary",
      destructive: "text-muted hover:text-destructive"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "transition-colors rounded-lg",
          sizeClasses[size],
          variantClasses[variant],
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = "IconButton"

