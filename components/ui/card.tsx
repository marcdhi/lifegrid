import { forwardRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: "default" | "interactive"
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-4 rounded-xl border border-white/[0.06] bg-card/50",
          variant === "interactive" && "hover:border-white/[0.12] transition-colors cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"

