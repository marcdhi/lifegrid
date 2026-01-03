"use client"

import { useEffect, useState, Suspense, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getTodayString } from "@/lib/utils"
import type { Category, Day, HourLog } from "@/lib/types"
import { HourGrid } from "@/components/hour-grid-timeline"
import { FitnessSummary } from "@/components/fitness-summary"
import { DateHeader } from "@/components/ui/date-header"
import { TextareaField } from "@/components/ui/textarea-field"

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
    if (!userId || categories.length === 0) return

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
          // Join categories manually
          const logsWithCategories = logs.map(log => {
            const category = categories.find(c => c.id === log.category_id)
            return {
              ...log,
              category: category || undefined
            }
          })
          setHourLogs(logsWithCategories as HourLog[])
        }
      }

      setLoading(false)
    }

    fetchDayData()
  }, [supabase, userId, currentDate, categories])
  
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

  const handleBlockUpdate = async (id: string, updates: Partial<HourLog>) => {
    const { error } = await supabase
      .from('hour_logs')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setHourLogs(prev =>
        prev.map(log => {
          if (log.id === id) {
            const updated = { ...log, ...updates }
            // If category_id changed, update category reference
            if (updates.category_id) {
              const category = categories.find(c => c.id === updates.category_id)
              return { ...updated, category: category || undefined }
            }
            return updated
          }
          return log
        })
      )
    }
  }

  const handleBlockCreate = async (hour: number, categoryId: string, durationMinutes: number, startOffset?: number) => {
    if (!day || !userId) return

    const { data: newLog, error } = await supabase
      .from('hour_logs')
      .insert({
        user_id: userId,
        day_id: day.id,
        hour,
        category_id: categoryId,
        duration_minutes: durationMinutes,
        start_offset: startOffset || 0,
      })
      .select()
      .single()

    if (!error && newLog) {
      // Join category
      const category = categories.find(c => c.id === categoryId)
      setHourLogs(prev => [...prev, { ...newLog, category: category || undefined }])
    }
  }

  const handleBlockDelete = async (id: string) => {
    const { error } = await supabase
      .from('hour_logs')
      .delete()
      .eq('id', id)

    if (!error) {
      setHourLogs(prev => prev.filter(log => log.id !== id))
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Date Header */}
        <DateHeader
          date={currentDate}
          onPrevious={() => navigateDay(-1)}
          onNext={() => navigateDay(1)}
          onToday={() => setCurrentDate(getTodayString())}
        />

        {/* Hour grid timeline */}
        <HourGrid
          hours={hourLogs}
          categories={categories}
          onBlockUpdate={handleBlockUpdate}
          onBlockCreate={handleBlockCreate}
          onBlockDelete={handleBlockDelete}
        />

        {/* Day notes */}
        <div className="space-y-6 pt-6 border-t border-white/[0.06]">
          <TextareaField
            label="Highlights"
            value={localHighlights}
            onChange={handleHighlightsChange}
            placeholder="What stood out today?"
            rows={2}
          />
          <TextareaField
            label="Notes"
            value={localNotes}
            onChange={handleNotesChange}
            placeholder="Any other thoughts..."
            rows={2}
          />
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
        <p className="text-muted">Loading...</p>
      </div>
    }>
      <TodayContent />
    </Suspense>
  )
}

