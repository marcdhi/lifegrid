"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Day, HourLog, Category } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DayCell {
  date: string
  logs: HourLog[]
  dayData?: Day
}

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
        setCategories(data)
      }
    }
    fetchCategories()
  }, [supabase])

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

  // Generate all days of the year
  const yearDays = useMemo(() => {
    const result: DayCell[] = []
    const date = new Date(currentYear, 0, 1)

    while (date.getFullYear() === currentYear) {
      const dateString = date.toISOString().split('T')[0]
      const dayData = days.find(d => d.date === dateString)
      const logs = dayData ? hourLogs.filter(l => l.day_id === dayData.id) : []

      result.push({
        date: dateString,
        logs,
        dayData,
      })

      date.setDate(date.getDate() + 1)
    }

    return result
  }, [currentYear, days, hourLogs])

  // Calculate dominant color for a day based on hour logs
  const getDayColor = (dayCell: DayCell): string => {
    if (dayCell.logs.length === 0) return 'transparent'

    // Count hours per category
    const categoryCounts = new Map<string, number>()
    dayCell.logs.forEach(log => {
      categoryCounts.set(log.category_id, (categoryCounts.get(log.category_id) || 0) + 1)
    })

    // Find dominant category
    let dominantCategoryId = ''
    let maxCount = 0
    categoryCounts.forEach((count, categoryId) => {
      if (count > maxCount) {
        maxCount = count
        dominantCategoryId = categoryId
      }
    })

    const category = categories.find(c => c.id === dominantCategoryId)
    return category?.color || '#4B4B4B'
  }

  // Navigate to specific day
  const handleDayClick = (date: string) => {
    router.push(`/today?date=${date}`)
  }

  // Group days by month
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: DayCell[] }[] = []
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1)
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'long' })
      const monthDays = yearDays.filter(d => {
        const date = new Date(d.date)
        return date.getMonth() === month
      })
      
      groups.push({ month: monthName, days: monthDays })
    }
    
    return groups
  }, [yearDays, currentYear])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading year...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">{currentYear}</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentYear(new Date().getFullYear())}
              className="px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
            >
              This Year
            </button>
            <button
              onClick={() => setCurrentYear(currentYear + 1)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Next year"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Year grid - monthly layout */}
        <div className="space-y-6">
          {monthGroups.map(({ month, days: monthDays }) => (
            <div key={month} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">{month}</h2>
              <div className="grid grid-cols-[repeat(31,1fr)] gap-1">
                {monthDays.map((dayCell) => {
                  const dayNumber = new Date(dayCell.date).getDate()
                  const color = getDayColor(dayCell)
                  const hasLogs = dayCell.logs.length > 0
                  const logPercentage = (dayCell.logs.length / 24) * 100

                  return (
                    <div
                      key={dayCell.date}
                      onClick={() => handleDayClick(dayCell.date)}
                      className="aspect-square rounded-sm border border-border transition-all hover:scale-110 hover:z-10 cursor-pointer hover:ring-2 hover:ring-foreground/20"
                      style={{
                        backgroundColor: color,
                        opacity: hasLogs ? 0.4 + (logPercentage / 100) * 0.6 : 1,
                      }}
                      title={`${dayCell.date} - ${dayCell.logs.length} hours logged - Click to view`}
                    >
                      {!hasLogs && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[0.5rem] text-muted-foreground">
                            {dayNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="pt-8 border-t border-border space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Legend</h3>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

