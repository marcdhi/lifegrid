"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day, HourLog, Category, FoodEntry, WorkoutCompletion, WorkoutExercise } from "@/lib/types"
import { formatDateString, filterCategoriesForUser } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { Card } from "@/components/ui/card"

function getCategoryColor(category: Category): string {
  return category.color // Use color directly from database
}

interface StatCardProps {
  label: string
  value: string | number
  className?: string
}

function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className={className}>
      <span className="text-sm tracking-wide text-muted font-medium block mb-2">{label}</span>
      <p className="text-3xl font-light text-primary tabular-nums">{value}</p>
    </div>
  )
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
        // Filter out system categories if user has custom ones with same name
        const filtered = filterCategoriesForUser(data, userId)
        setCategories(filtered)
      }
    }
    fetchCategories()
  }, [supabase, userId])

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

      const startDateString = formatDateString(startDate)
      const endDateString = formatDateString(now)

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

  // Calculate category breakdowns - using duration_minutes
  const categoryStats = useMemo(() => {
    const totalMinutes = hourLogs.reduce((sum, log) => sum + (log.duration_minutes || 60), 0)
    
    const stats = categories.map(category => {
      const minutesLogged = hourLogs
        .filter(log => log.category_id === category.id)
        .reduce((sum, log) => sum + (log.duration_minutes || 60), 0)
      
      const hours = minutesLogged / 60
      const percentage = totalMinutes > 0 ? (minutesLogged / totalMinutes) * 100 : 0

      return {
        category,
        hours,
        percentage,
      }
    })

    return stats.filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours)
  }, [categories, hourLogs])

  const totalHoursLogged = hourLogs.reduce((sum, log) => sum + (log.duration_minutes || 60), 0) / 60
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
    const dayMap = new Map<string, string[]>()
    workoutCompletions.forEach(c => {
      const existing = dayMap.get(c.date) || []
      dayMap.set(c.date, [...existing, c.exercise_id])
    })

    const daysWithWorkouts = dayMap.size
    const totalExercises = workoutCompletions.length
    const estimatedMinutes = totalExercises * 2

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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          title={
            activeSection === 'time' ? (
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-light tracking-tight text-primary tabular-nums">
                  {Math.round(totalHoursLogged)}
                </span>
                <span className="text-lg text-muted">hours logged</span>
              </div>
            ) : (
              <div className="flex gap-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-light tracking-tight text-primary tabular-nums">
                    {foodDayStats.totalEntries}
                  </span>
                  <span className="text-lg text-muted">meals</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-light tracking-tight text-primary tabular-nums">
                    {workoutStats.daysWithWorkouts}
                  </span>
                  <span className="text-lg text-muted">workout days</span>
                </div>
              </div>
            )
          }
          actions={
            <div className="flex gap-3">
              <button
                onClick={() => setActiveSection('time')}
                className={`px-3 py-1.5 text-sm tracking-wide transition-colors rounded-lg ${
                  activeSection === 'time'
                    ? 'text-primary bg-white/[0.06]'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setActiveSection('fitness')}
                className={`px-3 py-1.5 text-sm tracking-wide transition-colors rounded-lg ${
                  activeSection === 'fitness'
                    ? 'text-primary bg-white/[0.06]'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                Fitness
              </button>
            </div>
          }
        />
          
        {/* Time range selector */}
        <nav className="flex gap-4">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-sm tracking-wide transition-colors rounded-lg px-3 py-1.5 ${
                timeRange === range
                  ? 'text-primary bg-white/[0.04]'
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
            <div className="grid grid-cols-2 gap-6">
              <StatCard
                label="Days tracked"
                value={daysWithData}
              />
              <StatCard
                label="Avg hours per day"
                value={daysWithData > 0 ? (totalHoursLogged / daysWithData).toFixed(1) : '0'}
              />
            </div>

            {/* Category breakdown */}
            {categoryStats.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/[0.06]">
                <SectionHeader>Time distribution</SectionHeader>
                <div className="space-y-3">
                  {categoryStats.map(({ category, hours, percentage }) => (
                    <Card key={category.id}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-md"
                              style={{ backgroundColor: getCategoryColor(category) }}
                            />
                            <span className="text-sm text-secondary">{category.name}</span>
                          </div>
                          <span className="text-sm text-muted tabular-nums">
                            {hours.toFixed(1)}h · {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getCategoryColor(category),
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Food Stats */}
            <div className="grid grid-cols-2 gap-6">
              <StatCard
                label="Days with food logged"
                value={foodDayStats.daysWithFood}
              />
              <StatCard
                label="Avg entries per day"
                value={foodDayStats.avgPerDay.toFixed(1)}
              />
            </div>

            {/* Most eaten foods */}
            {foodTagStats.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/[0.06]">
                <SectionHeader>Most logged foods</SectionHeader>
                <div className="space-y-2">
                  {foodTagStats.map(([tag, count]) => {
                    const maxCount = foodTagStats[0][1]
                    const percentage = (count / maxCount) * 100
                    return (
                      <Card key={tag}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-secondary">{tag}</span>
                            <span className="text-sm text-muted tabular-nums">{count}×</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white/15 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Workout Stats */}
            <div className="space-y-4 pt-6 border-t border-white/[0.06]">
              <SectionHeader>Workout activity</SectionHeader>
              
              <div className="grid grid-cols-2 gap-6">
                <StatCard
                  label="Exercises completed"
                  value={workoutStats.totalExercises}
                />
                <StatCard
                  label="Est. time active"
                  value={
                    workoutStats.estimatedMinutes < 60 
                      ? `${workoutStats.estimatedMinutes}m`
                      : `${Math.floor(workoutStats.estimatedMinutes / 60)}h ${workoutStats.estimatedMinutes % 60}m`
                  }
                />
              </div>

              {/* Top exercises */}
              {workoutStats.topExercises.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm tracking-wide text-muted font-medium mb-3">Most completed exercises</h3>
                  <div className="space-y-2">
                    {workoutStats.topExercises.map(({ exercise, count }) => {
                      if (!exercise) return null
                      const maxCount = workoutStats.topExercises[0].count
                      const percentage = (count / maxCount) * 100
                      return (
                        <Card key={exercise.id}>
                          <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm text-secondary">{exercise.name}</span>
                              <span className="text-sm text-muted tabular-nums">{count}×</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white/15 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Empty state for fitness */}
            {foodTagStats.length === 0 && workoutStats.totalExercises === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-secondary">No fitness data logged yet</p>
                <p className="text-sm text-muted mt-1">Start tracking your meals and workouts</p>
              </div>
            )}
          </>
        )}

        {/* Philosophy */}
        <div className="pt-6 border-t border-white/[0.06]">
          <p className="text-sm text-muted italic text-center">
            Observational, not aspirational. No goals, no targets, no judgments.
          </p>
        </div>
      </div>
    </div>
  )
}
