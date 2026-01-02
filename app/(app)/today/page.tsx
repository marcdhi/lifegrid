"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getTodayString, getDateLabel, getAllHours } from "@/lib/utils"
import type { Category, Day, HourLog, HourCellData } from "@/lib/types"
import { HourGrid } from "@/components/hour-grid"
import { ChevronLeft, ChevronRight } from "lucide-react"

function TodayContent() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const [currentDate, setCurrentDate] = useState<string>(dateParam || getTodayString())
  const [day, setDay] = useState<Day | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [hourLogs, setHourLogs] = useState<HourLog[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  // Update currentDate when URL param changes
  useEffect(() => {
    if (dateParam) {
      setCurrentDate(dateParam)
    }
  }, [dateParam])

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

  // Fetch or create day + hour logs
  useEffect(() => {
    if (!userId) return

    const fetchDayData = async () => {
      setLoading(true)

      // Check if day exists
      let { data: existingDay, error: dayError } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', userId)
        .eq('date', currentDate)
        .single()

      // If day doesn't exist, create it
      if (dayError && dayError.code === 'PGRST116') {
        const { data: newDay, error: createError } = await supabase
          .from('days')
          .insert({
            user_id: userId,
            date: currentDate,
          })
          .select()
          .single()

        if (!createError && newDay) {
          existingDay = newDay
        }
      }

      if (existingDay) {
        setDay(existingDay)

        // Fetch hour logs for this day
        const { data: logs, error: logsError } = await supabase
          .from('hour_logs')
          .select('*')
          .eq('day_id', existingDay.id)

        if (!logsError && logs) {
          setHourLogs(logs)
        }
      }

      setLoading(false)
    }

    fetchDayData()
  }, [supabase, userId, currentDate])

  const handleHourUpdate = async (hour: number, categoryId: string) => {
    if (!day || !userId) return

    // Check if hour log already exists
    const existingLog = hourLogs.find(log => log.hour === hour)

    if (existingLog) {
      // Update existing
      const { error } = await supabase
        .from('hour_logs')
        .update({ category_id: categoryId })
        .eq('id', existingLog.id)

      if (!error) {
        setHourLogs(prev =>
          prev.map(log =>
            log.hour === hour ? { ...log, category_id: categoryId } : log
          )
        )
      }
    } else {
      // Insert new
      const { data: newLog, error } = await supabase
        .from('hour_logs')
        .insert({
          user_id: userId,
          day_id: day.id,
          hour,
          category_id: categoryId,
        })
        .select()
        .single()

      if (!error && newLog) {
        setHourLogs(prev => [...prev, newLog])
      }
    }
  }

  const handleHourClear = async (hour: number) => {
    const existingLog = hourLogs.find(log => log.hour === hour)
    if (!existingLog) return

    const { error } = await supabase
      .from('hour_logs')
      .delete()
      .eq('id', existingLog.id)

    if (!error) {
      setHourLogs(prev => prev.filter(log => log.hour !== hour))
    }
  }

  const navigateDay = (offset: number) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + offset)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setCurrentDate(`${year}-${month}-${day}`)
  }

  // Build hour cell data
  const hourCellData: HourCellData[] = getAllHours().map(hour => {
    const log = hourLogs.find(l => l.hour === hour)
    const category = log ? categories.find(c => c.id === log.category_id) : undefined

    return {
      hour,
      category,
      note: log?.note,
      logId: log?.id,
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with date navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {getDateLabel(currentDate)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{currentDate}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(getTodayString())}
              className="px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hour grid */}
        <HourGrid
          hours={hourCellData}
          categories={categories}
          onHourUpdate={handleHourUpdate}
          onHourClear={handleHourClear}
        />

        {/* Day notes (optional section) */}
        <div className="space-y-4 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold">Day Notes</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Highlights
              </label>
              <textarea
                value={day?.highlights || ''}
                onChange={async (e) => {
                  if (!day) return
                  const { error } = await supabase
                    .from('days')
                    .update({ highlights: e.target.value })
                    .eq('id', day.id)
                  
                  if (!error) {
                    setDay({ ...day, highlights: e.target.value })
                  }
                }}
                placeholder="What stood out today?"
                className="w-full p-3 bg-background text-foreground border border-border rounded-md resize-none focus:ring-2 focus:ring-ring focus:outline-none placeholder:text-muted-foreground"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Notes
              </label>
              <textarea
                value={day?.notes || ''}
                onChange={async (e) => {
                  if (!day) return
                  const { error } = await supabase
                    .from('days')
                    .update({ notes: e.target.value })
                    .eq('id', day.id)
                  
                  if (!error) {
                    setDay({ ...day, notes: e.target.value })
                  }
                }}
                placeholder="Any other thoughts..."
                className="w-full p-3 bg-background text-foreground border border-border rounded-md resize-none focus:ring-2 focus:ring-ring focus:outline-none placeholder:text-muted-foreground"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TodayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <TodayContent />
    </Suspense>
  )
}

