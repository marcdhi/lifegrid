import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string | ReactNode
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-end justify-between pb-6 border-b border-white/[0.06]", className)}>
      <div className="flex items-baseline gap-4">
        {typeof title === 'string' ? (
          <h1 className="text-5xl font-light tracking-tight text-primary">
            {title}
          </h1>
        ) : (
          title
        )}
        {subtitle && (
          <p className="text-sm tracking-wide text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}

