import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("py-12 text-center space-y-3", className)}>
      {icon && (
        <div className="flex justify-center text-muted opacity-50">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base text-secondary">{title}</p>
        {description && (
          <p className="text-sm text-muted">{description}</p>
        )}
      </div>
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  )
}

