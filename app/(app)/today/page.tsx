"use client"

import { useEffect, useState, Suspense, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getTodayString, getDateLabel, getAllHours } from "@/lib/utils"
import type { Category, Day, HourLog, HourCellData } from "@/lib/types"
import { HourGrid } from "@/components/hour-grid"
import { FitnessSummary } from "@/components/fitness-summary"
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
  
  // Local state for notes to avoid controlled input race conditions
  const [localHighlights, setLocalHighlights] = useState('')
  const [localNotes, setLocalNotes] = useState('')
  const highlightsSaveTimeout = useRef<NodeJS.Timeout | null>(null)
  const notesSaveTimeout = useRef<NodeJS.Timeout | null>(null)

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
        // Sync local state with fetched data
        setLocalHighlights(existingDay.highlights || '')
        setLocalNotes(existingDay.notes || '')

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
  
  // Debounced save for highlights
  const saveHighlights = useCallback(async (value: string) => {
    if (!day) return
    await supabase
      .from('days')
      .update({ highlights: value })
      .eq('id', day.id)
  }, [supabase, day])
  
  // Debounced save for notes
  const saveNotes = useCallback(async (value: string) => {
    if (!day) return
    await supabase
      .from('days')
      .update({ notes: value })
      .eq('id', day.id)
  }, [supabase, day])
  
  const handleHighlightsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setLocalHighlights(value)
    
    // Debounce the save
    if (highlightsSaveTimeout.current) {
      clearTimeout(highlightsSaveTimeout.current)
    }
    highlightsSaveTimeout.current = setTimeout(() => {
      saveHighlights(value)
    }, 500)
  }
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setLocalNotes(value)
    
    // Debounce the save
    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current)
    }
    notesSaveTimeout.current = setTimeout(() => {
      saveNotes(value)
    }, 500)
  }

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

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
    return { day, month, weekday }
  }
  
  const { day: dayNum, month, weekday } = formatDateDisplay(currentDate)

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header - typography-led, date dominates emotionally */}
        <header className="flex items-end justify-between pb-6 border-b border-white/[0.06]">
          <div className="flex items-baseline gap-4">
            {/* Large date number - anchor */}
            <span className="text-6xl font-light tracking-tighter text-primary tabular-nums">
              {dayNum}
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">{month}</span>
              <span className="text-sm text-secondary">{weekday}</span>
            </div>
          </div>
          
          {/* Navigation - minimal */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 text-muted hover:text-secondary transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(getTodayString())}
              className="px-3 py-1 text-[11px] uppercase tracking-wider text-muted hover:text-secondary transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 text-muted hover:text-secondary transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </header>

        {/* Hour grid */}
        <HourGrid
          hours={hourCellData}
          categories={categories}
          onHourUpdate={handleHourUpdate}
          onHourClear={handleHourClear}
        />

        {/* Day notes - inline, minimal design */}
        <div className="space-y-6 pt-8 border-t border-white/[0.06]">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-secondary">
              Highlights
            </label>
            <textarea
              value={localHighlights}
              onChange={handleHighlightsChange}
              placeholder="What stood out today?"
              className="w-full bg-transparent text-primary border-0 border-b border-transparent focus:border-white/[0.06] resize-none focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:rounded-lg placeholder:text-muted text-sm py-2 transition-colors"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-secondary">
              Notes
            </label>
            <textarea
              value={localNotes}
              onChange={handleNotesChange}
              placeholder="Any other thoughts..."
              className="w-full bg-transparent text-primary border-0 border-b border-transparent focus:border-white/[0.06] resize-none focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:rounded-lg placeholder:text-muted text-sm py-2 transition-colors"
              rows={2}
            />
          </div>
        </div>

        {/* Fitness Summary */}
        {userId && (
          <FitnessSummary date={currentDate} userId={userId} />
        )}
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

