"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Day, HourLog, Category } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { filterCategoriesForUser } from "@/lib/utils"

function getCategoryColor(category?: Category): string {
  if (!category) return 'transparent'
  return category.color // Use color directly from database
}

interface DayData {
  date: string
  dayNumber: number
  logs: HourLog[]
  dayRecord?: Day
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function YearPage() {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [days, setDays] = useState<Day[]>([])
  const [hourLogs, setHourLogs] = useState<HourLog[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [supabase])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!error && data) {
        // Filter out system categories if user has custom ones with same name
        const filtered = filterCategoriesForUser(data, userId)
        setCategories(filtered)
      }
    }
    fetchCategories()
  }, [supabase, userId])

  // Fetch year data
  useEffect(() => {
    if (!userId) return

    const fetchYearData = async () => {
      setLoading(true)

      const startDate = `${currentYear}-01-01`
      const endDate = `${currentYear}-12-31`

      // Fetch days
      const { data: daysData, error: daysError } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (!daysError && daysData) {
        setDays(daysData)

        // Fetch all hour logs for these days
        const dayIds = daysData.map(d => d.id)
        if (dayIds.length > 0) {
          const { data: logsData, error: logsError } = await supabase
            .from('hour_logs')
            .select('*')
            .in('day_id', dayIds)

          if (!logsError && logsData) {
            setHourLogs(logsData)
          }
        }
      }

      setLoading(false)
    }

    fetchYearData()
  }, [supabase, userId, currentYear])

  // Generate year data organized by month
  const yearData = useMemo(() => {
    const result: { month: number; monthName: string; days: DayData[] }[] = []
    
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate()
      const monthDays: DayData[] = []
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayRecord = days.find(d => d.date === dateStr)
        const logs = dayRecord ? hourLogs.filter(l => l.day_id === dayRecord.id) : []
        
        monthDays.push({
          date: dateStr,
          dayNumber: day,
          logs,
          dayRecord,
        })
      }
      
      result.push({
        month,
        monthName: MONTHS[month],
        days: monthDays,
      })
    }
    
    return result
  }, [currentYear, days, hourLogs])

  // Get category for a specific hour on a specific day
  const getHourCategory = (logs: HourLog[], hour: number): Category | undefined => {
    // Find a log that covers this hour (checking duration and intersection)
    const log = logs.find(l => {
      const startTotalMinutes = l.hour * 60 + (l.start_offset || 0)
      const endTotalMinutes = startTotalMinutes + l.duration_minutes
      
      const cellStartMinutes = hour * 60
      const cellEndMinutes = (hour + 1) * 60
      
      // Check for intersection: Max(Start1, Start2) < Min(End1, End2)
      return Math.max(startTotalMinutes, cellStartMinutes) < Math.min(endTotalMinutes, cellEndMinutes)
    })

    if (!log) return undefined
    return categories.find(c => c.id === log.category_id)
  }

  // Navigate to specific day
  const handleDayClick = (date: string) => {
    router.push(`/today?date=${date}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading year...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          title={
            <span className="text-5xl font-light tracking-tight text-primary tabular-nums">
              {currentYear}
            </span>
          }
          subtitle={`${days.length} days tracked`}
          actions={
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setCurrentYear(currentYear - 1)}
                className="p-2 text-muted hover:text-secondary transition-colors rounded-lg"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentYear(new Date().getFullYear())}
                className="px-3 py-1.5 text-xs tracking-wide text-muted hover:text-secondary transition-colors rounded-lg"
              >
                This year
              </button>
              <button
                onClick={() => setCurrentYear(currentYear + 1)}
                className="p-2 text-muted hover:text-secondary transition-colors rounded-lg"
                aria-label="Next year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          }
        />

        {/* Year barcode - the compressed memory object */}
        <div className="space-y-1">
          {yearData.map(({ month, monthName, days: monthDays }) => (
            <div key={month} className="flex items-start gap-3">
              {/* Month label */}
              <div className="w-10 flex-shrink-0 pt-1">
                <span className="text-[10px] font-mono tracking-wider text-muted">
                  {monthName}
                </span>
              </div>
              
              {/* Days */}
              <div className="flex-1 space-y-px">
                {monthDays.map((dayData) => (
                  <div
                    key={dayData.date}
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => handleDayClick(dayData.date)}
                  >
                    {/* Day number */}
                    <span className="w-6 text-right text-[9px] font-mono text-muted group-hover:text-secondary transition-colors tabular-nums">
                      {String(dayData.dayNumber).padStart(2, '0')}
                    </span>
                    
                    {/* 24 hour tiles - the barcode */}
                    <div className="flex-1 flex gap-px">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const category = getHourCategory(dayData.logs, hour)
                        const color = getCategoryColor(category)
                        
                        return (
                          <div
                            key={hour}
                            className="year-tile flex-1 h-[7px] rounded-sm"
                            style={{
                              backgroundColor: category ? color : '#1A120B',
                            }}
                            title={`${dayData.date} ${hour}:00 - ${category?.name || 'Empty'}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend - minimal, horizontal */}
        <div className="pt-6 border-t border-white/[0.06]">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                <span className="text-[10px] text-muted">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
