"use client"

import { useEffect, useState, Suspense, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { LayoutGrid, CheckSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getTodayString, cn, filterCategoriesForUser } from "@/lib/utils"
import type { Category, Day, HourLog, Task } from "@/lib/types"
import { HourGrid } from "@/components/hour-grid-timeline"
import { TaskList } from "@/components/task-list"
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
  const [tasks, setTasks] = useState<Task[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'tasks'>('grid')

  useEffect(() => {
    const savedMode = localStorage.getItem('lifegrid_view_mode')
    if (savedMode === 'grid' || savedMode === 'tasks') {
      setViewMode(savedMode)
    }
  }, [])

  const handleViewModeChange = (mode: 'grid' | 'tasks') => {
    setViewMode(mode)
    localStorage.setItem('lifegrid_view_mode', mode)
  }

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
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
        setUserEmail(user.email || null)
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

        // Fetch tasks
        const { data: fetchedTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('day_id', existingDay.id)
        
        if (!tasksError && fetchedTasks) {
           setTasks(fetchedTasks)
           
           // Auto-populate recurring tasks for this day if not already present
           // Get user's recurring tasks (templates)
           const { data: recurringTasks } = await supabase
             .from('tasks')
             .select('*')
             .eq('user_id', userId)
             .eq('is_recurring', true)
           
           if (recurringTasks && recurringTasks.length > 0) {
             // Check which recurring tasks are already created for this day
             // Include both template_task_id matches AND the recurring task itself if it's on this day
             const existingTemplateIds = new Set(
               fetchedTasks
                 .filter(t => t.template_task_id)
                 .map(t => t.template_task_id)
             )
             
             const existingRecurringTaskIds = new Set(
               fetchedTasks
                 .filter(t => t.is_recurring && t.day_id === existingDay.id)
                 .map(t => t.id)
             )
             
             // Create instances for recurring tasks that don't exist yet
             const tasksToCreate = recurringTasks.filter(
               rt => !existingTemplateIds.has(rt.id) && !existingRecurringTaskIds.has(rt.id)
             )
             
             if (tasksToCreate.length > 0) {
               const newTaskInstances = tasksToCreate.map(rt => ({
                 user_id: userId,
                 day_id: existingDay.id,
                 category_id: rt.category_id,
                 title: rt.title,
                 completed: false,
                 is_recurring: false,
                 template_task_id: rt.id,
                 notes: rt.notes
               }))
               
               const { data: createdTasks } = await supabase
                 .from('tasks')
                 .insert(newTaskInstances)
                 .select()
               
               if (createdTasks) {
                 // Add newly created tasks to the list
                 setTasks(prev => [...prev, ...createdTasks])
               }
             }
           }
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

  // Task Handlers
  const handleTaskCreate = async (title: string, categoryId: string, isRecurring: boolean = false) => {
    if (!day || !userId) return
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        day_id: day.id,
        title,
        category_id: categoryId,
        is_recurring: isRecurring
      })
      .select()
      .single()
    if (!error && data) {
      setTasks(prev => [...prev, data])
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }
  
  const handleCategoryCreate = async (name: string, color: string) => {
    if (!userId) return null
    // Get max sort order
    const maxSort = categories.reduce((max, c) => Math.max(max, c.sort_order), 0)
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name,
        color,
        sort_order: maxSort + 1
      })
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => [...prev, data])
      return data
    }
    return null
  }

  const handleTaskComplete = async (taskId: string, hour: number, durationMinutes: number, startOffset: number, notes?: string, keepActive?: boolean) => {
    if (!day || !userId) return
    
    // 1. Update Task - only mark as completed if keepActive is false
    if (!keepActive) {
      await handleTaskUpdate(taskId, { completed: true, notes })
    } else {
      // Still update notes if provided, but keep task active
      if (notes !== undefined) {
        await handleTaskUpdate(taskId, { notes })
      }
    }
    
    // 2. Create Hour Log
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Create a new hour log entry for this task completion
    // Multiple logs can exist for the same task if keepActive is true

    const { data: newLog, error } = await supabase
      .from('hour_logs')
      .insert({
        user_id: userId,
        day_id: day.id,
        hour,
        category_id: task.category_id,
        duration_minutes: durationMinutes,
        start_offset: startOffset,
        task_id: taskId,
        note: notes
      })
      .select()
      .single()

    if (!error && newLog) {
       const category = categories.find(c => c.id === newLog.category_id)
       setHourLogs(prev => [...prev, { ...newLog, category: category || undefined }])
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
    <div className="min-h-screen p-4 md:p-6 lg:p-10 pb-20 md:pb-6">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Date Header */}
        <DateHeader
          date={currentDate}
          onPrevious={() => navigateDay(-1)}
          onNext={() => navigateDay(1)}
          onToday={() => setCurrentDate(getTodayString())}
          userEmail={userEmail}
        />

        {/* View Toggle */}
        <div className="flex justify-start">
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                viewMode === 'grid' ? "bg-white/10 text-white shadow-sm" : "text-muted hover:text-secondary"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => handleViewModeChange('tasks')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                viewMode === 'tasks' ? "bg-white/10 text-white shadow-sm" : "text-muted hover:text-secondary"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tasks
            </button>
          </div>
        </div>

        {/* Content View */}
        {viewMode === 'grid' ? (
          <HourGrid
            hours={hourLogs}
            categories={categories}
            onBlockUpdate={handleBlockUpdate}
            onBlockCreate={handleBlockCreate}
            onBlockDelete={handleBlockDelete}
          />
        ) : (
          <TaskList 
            tasks={tasks}
            categories={categories}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskComplete={handleTaskComplete}
            onCategoryCreate={handleCategoryCreate}
          />
        )}

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

