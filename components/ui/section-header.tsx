import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function SectionHeader({ children, className, action }: SectionHeaderProps) {
  if (action) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <h2 className="text-[11px] tracking-wide text-muted font-medium">
          {children}
        </h2>
        {action}
      </div>
    )
  }

  return (
    <h2 className={cn("text-[11px] tracking-wide text-muted font-medium", className)}>
      {children}
    </h2>
  )
}

