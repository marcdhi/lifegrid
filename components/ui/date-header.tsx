import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateHeaderProps {
  date: string // YYYY-MM-DD
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  className?: string
}

export function DateHeader({ date, onPrevious, onNext, onToday, className }: DateHeaderProps) {
  const dateObj = new Date(date + 'T00:00:00')
  const day = dateObj.getDate()
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' })
  const year = dateObj.getFullYear()
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <header className={cn("flex items-end justify-between pb-6 border-b border-white/[0.06]", className)}>
      <div className="flex items-end gap-5">
        {/* Large day number */}
        <div className="flex flex-col items-end">
          <span className="text-7xl font-light tracking-tight text-primary tabular-nums leading-none">
            {day}
          </span>
        </div>
        
        {/* Month, year, weekday stacked */}
        <div className="flex flex-col justify-end pb-1.5 gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-light text-primary tracking-tight">{month}</span>
            <span className="text-sm text-muted tabular-nums">{year}</span>
          </div>
          <span className="text-sm text-secondary">{weekday}</span>
        </div>
      </div>
      
      <nav className="flex items-center gap-1 pb-1">
        <button
          onClick={onPrevious}
          className="p-2 text-muted hover:text-secondary transition-colors rounded-lg"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-xs tracking-wide text-muted hover:text-secondary transition-colors rounded-lg hover:bg-white/[0.03]"
        >
          Today
        </button>
        <button
          onClick={onNext}
          className="p-2 text-muted hover:text-secondary transition-colors rounded-lg"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </header>
  )
}

