import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateHeaderProps {
  date: string // YYYY-MM-DD
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  className?: string
  userEmail?: string | null
}

export function DateHeader({ date, onPrevious, onNext, onToday, className, userEmail }: DateHeaderProps) {
  const dateObj = new Date(date + 'T00:00:00')
  const day = dateObj.getDate()
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' })
  const year = dateObj.getFullYear()
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

  // Get ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (n: number): string => {
    const j = n % 10
    const k = n % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }
  const ordinalSuffix = getOrdinalSuffix(day)

  // Extract and format username from email (part before @)
  // Split by dots, capitalize each part, join with spaces
  const username = userEmail 
    ? userEmail
        .split('@')[0]
        .split('.')
        .map(part => part.trim())
        .filter(part => part.length > 0)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
    : null

  return (
    <div className={cn("space-y-6", className)}>
      {/* Greeting */}
      {username && (
        <div className="pb-2">
          <span className="text-base text-muted">Hi {username}</span>
        </div>
      )}
      
      {/* Date Header */}
      <header className="flex items-end justify-between pb-6 border-b border-white/[0.06]">
        <div className="flex items-end gap-2">
          {/* Large day number with ordinal superscript */}
          <span className="text-7xl font-light tracking-tight text-primary tabular-nums leading-none relative">
            {day}
            <sup className="text-xl font-light leading-none align-top">{ordinalSuffix}</sup>
          </span>
          
          {/* Month, year, weekday stacked */}
          <div className="flex flex-col justify-end gap-0.5 pb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-light text-primary tracking-tight leading-tight">{month}</span>
              <span className="text-lg font-light text-primary tracking-tight leading-tight tabular-nums">{year}</span>
            </div>
            <span className="text-lg font-light text-primary tracking-tight leading-tight">{weekday}</span>
          </div>
        </div>
        
        <nav className="flex items-end gap-1 pb-1">
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
    </div>
  )
}

