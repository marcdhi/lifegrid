"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day, HourLog, Category, FoodEntry, WorkoutCompletion, WorkoutExercise } from "@/lib/types"

// Dusty, desaturated category colors (Apple-like)
const categoryColorMap: Record<string, string> = {
  'Sleep': '#1E1F2E',
  'Work': '#5C2A2A',
  'Hobbies / Projects': '#8B5A2B',
  'Freelance': '#5E4A6B',
  'Exercise': '#2B4A42',
  'Friends': '#3A5A6B',
  'Relaxation & Leisure': '#3D444A',
  'Dating / Partner': '#6B4A52',
  'Family': '#5A4A3A',
  'Productive / Chores': '#4A5030',
  'Travel': '#2E3D4A',
  'Misc / Getting Ready': '#2A2A2A',
}

function getCategoryColor(category: Category): string {
  return categoryColorMap[category.name] || category.color
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<Day[]>([])
  const [hourLogs, setHourLogs] = useState<HourLog[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [activeSection, setActiveSection] = useState<'time' | 'fitness'>('time')
  
  // Fitness data
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [workoutCompletions, setWorkoutCompletions] = useState<WorkoutCompletion[]>([])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])

  const supabase = createClient()

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

  // Fetch data based on time range
  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setLoading(true)

      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      const startDateString = startDate.toISOString().split('T')[0]
      const endDateString = now.toISOString().split('T')[0]

      // Fetch days
      const { data: daysData, error: daysError } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateString)
        .lte('date', endDateString)
        .order('date', { ascending: true })

      if (!daysError && daysData) {
        setDays(daysData)

        // Fetch hour logs
        const dayIds = daysData.map(d => d.id)
        if (dayIds.length > 0) {
          const { data: logsData, error: logsError } = await supabase
            .from('hour_logs')
            .select('*')
            .in('day_id', dayIds)

          if (!logsError && logsData) {
            setHourLogs(logsData)
          }
        } else {
          setHourLogs([])
        }
      }

      // Fetch fitness data
      const { data: foodData } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateString)
        .lte('date', endDateString)

      if (foodData) {
        setFoodEntries(foodData)
      }

      const { data: completionsData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateString)
        .lte('date', endDateString)

      if (completionsData) {
        setWorkoutCompletions(completionsData)
      }

      // Fetch exercises (one-time)
      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*')

      if (exercisesData) {
        setExercises(exercisesData)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId, timeRange])

  // Calculate category breakdowns
  const categoryStats = useMemo(() => {
    const stats = categories.map(category => {
      const hoursLogged = hourLogs.filter(log => log.category_id === category.id).length
      const percentage = hourLogs.length > 0 ? (hoursLogged / hourLogs.length) * 100 : 0

      return {
        category,
        hours: hoursLogged,
        percentage,
      }
    })

    return stats.filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours)
  }, [categories, hourLogs])

  const totalHoursLogged = hourLogs.length
  const daysWithData = days.filter(d => {
    const dayLogs = hourLogs.filter(log => log.day_id === d.id)
    return dayLogs.length > 0
  }).length

  // Fitness analytics
  const foodTagStats = useMemo(() => {
    const tagCounts = new Map<string, number>()
    foodEntries.forEach(entry => {
      entry.food_tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [foodEntries])

  const foodDayStats = useMemo(() => {
    const dayMap = new Map<string, number>()
    foodEntries.forEach(entry => {
      dayMap.set(entry.date, (dayMap.get(entry.date) || 0) + 1)
    })
    const counts = Array.from(dayMap.values())
    const avg = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0
    return {
      daysWithFood: dayMap.size,
      totalEntries: foodEntries.length,
      avgPerDay: avg,
    }
  }, [foodEntries])

  const workoutStats = useMemo(() => {
    // Group completions by date
    const dayMap = new Map<string, string[]>()
    workoutCompletions.forEach(c => {
      const existing = dayMap.get(c.date) || []
      dayMap.set(c.date, [...existing, c.exercise_id])
    })

    // Get unique dates with at least one completion
    const daysWithWorkouts = dayMap.size
    
    // Count total exercises completed
    const totalExercises = workoutCompletions.length

    // Calculate estimated time (rough: 2 min per exercise)
    const estimatedMinutes = totalExercises * 2

    // Get exercise names
    const exerciseFrequency = new Map<string, number>()
    workoutCompletions.forEach(c => {
      exerciseFrequency.set(c.exercise_id, (exerciseFrequency.get(c.exercise_id) || 0) + 1)
    })

    const topExercises = Array.from(exerciseFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        exercise: exercises.find(e => e.id === id),
        count,
      }))
      .filter(e => e.exercise)

    return {
      daysWithWorkouts,
      totalExercises,
      estimatedMinutes,
      topExercises,
    }
  }, [workoutCompletions, exercises])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header with section toggle */}
        <header className="pb-6 border-b border-white/[0.06]">
          <div className="flex gap-6 mb-6">
            <button
              onClick={() => setActiveSection('time')}
              className={`text-[11px] uppercase tracking-wider transition-colors ${
                activeSection === 'time'
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              Time
            </button>
            <button
              onClick={() => setActiveSection('fitness')}
              className={`text-[11px] uppercase tracking-wider transition-colors ${
                activeSection === 'fitness'
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              Fitness
            </button>
          </div>
          
          {activeSection === 'time' ? (
            <div>
              <span className="text-4xl font-light tracking-tighter text-primary tabular-nums">
                {totalHoursLogged}
              </span>
              <span className="text-sm text-muted ml-2">hours logged</span>
            </div>
          ) : (
            <div className="flex gap-8">
              <div>
                <span className="text-4xl font-light tracking-tighter text-primary tabular-nums">
                  {foodDayStats.totalEntries}
                </span>
                <span className="text-sm text-muted ml-2">meals logged</span>
              </div>
              <div>
                <span className="text-4xl font-light tracking-tighter text-primary tabular-nums">
                  {workoutStats.daysWithWorkouts}
                </span>
                <span className="text-sm text-muted ml-2">workout days</span>
              </div>
            </div>
          )}
        </header>
          
        {/* Time range selector - minimal */}
        <nav className="flex gap-4">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-[11px] uppercase tracking-wider transition-colors ${
                timeRange === range
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              {range === 'week' ? '7 days' : range === 'month' ? '30 days' : 'Year'}
            </button>
          ))}
        </nav>

        {activeSection === 'time' ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">Days tracked</span>
                <p className="text-2xl font-light text-primary tabular-nums mt-1">{daysWithData}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">Avg hours/day</span>
                <p className="text-2xl font-light text-primary tabular-nums mt-1">
                  {daysWithData > 0 ? (totalHoursLogged / daysWithData).toFixed(1) : '0'}
                </p>
              </div>
            </div>

            {/* Category breakdown - bar visualization */}
            {categoryStats.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/[0.06]">
                <h2 className="text-[10px] uppercase tracking-wider text-muted">Time Distribution</h2>
                <div className="space-y-3">
                  {categoryStats.map(({ category, hours, percentage }) => (
                    <div key={category.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: getCategoryColor(category) }}
                          />
                          <span className="text-xs text-secondary">{category.name}</span>
                        </div>
                        <span className="text-xs text-muted tabular-nums">
                          {hours}h · {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Food Stats */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">Days with food logged</span>
                <p className="text-2xl font-light text-primary tabular-nums mt-1">{foodDayStats.daysWithFood}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">Avg entries/day</span>
                <p className="text-2xl font-light text-primary tabular-nums mt-1">
                  {foodDayStats.avgPerDay.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Most eaten foods */}
            {foodTagStats.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/[0.06]">
                <h2 className="text-[10px] uppercase tracking-wider text-muted">Most Logged Foods</h2>
                <div className="space-y-2">
                  {foodTagStats.map(([tag, count]) => {
                    const maxCount = foodTagStats[0][1]
                    const percentage = (count / maxCount) * 100
                    return (
                      <div key={tag} className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-secondary">{tag}</span>
                          <span className="text-xs text-muted tabular-nums">{count}×</span>
                        </div>
                        <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white/10 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Workout Stats */}
            <div className="space-y-4 pt-6 border-t border-white/[0.06]">
              <h2 className="text-[10px] uppercase tracking-wider text-muted">Workout Activity</h2>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted">Exercises completed</span>
                  <p className="text-2xl font-light text-primary tabular-nums mt-1">{workoutStats.totalExercises}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted">Est. time active</span>
                  <p className="text-2xl font-light text-primary tabular-nums mt-1">
                    {workoutStats.estimatedMinutes < 60 
                      ? `${workoutStats.estimatedMinutes}m`
                      : `${Math.floor(workoutStats.estimatedMinutes / 60)}h ${workoutStats.estimatedMinutes % 60}m`
                    }
                  </p>
                </div>
              </div>

              {/* Top exercises */}
              {workoutStats.topExercises.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted mb-3">Most Completed Exercises</h3>
                  <div className="space-y-2">
                    {workoutStats.topExercises.map(({ exercise, count }) => {
                      if (!exercise) return null
                      const maxCount = workoutStats.topExercises[0].count
                      const percentage = (count / maxCount) * 100
                      return (
                        <div key={exercise.id} className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-secondary">{exercise.name}</span>
                            <span className="text-xs text-muted tabular-nums">{count}×</span>
                          </div>
                          <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white/10 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Empty state for fitness */}
            {foodTagStats.length === 0 && workoutStats.totalExercises === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted">No fitness data logged yet</p>
                <p className="text-xs text-muted mt-1">Start tracking your meals and workouts</p>
              </div>
            )}
          </>
        )}

        {/* Philosophy */}
        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-muted italic">
            Observational, not aspirational. No goals, no targets, no judgments.
          </p>
        </div>
      </div>
    </div>
  )
}
