"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import type { 
  FoodEntry, 
  WorkoutPlan, 
  WorkoutExercise, 
  WorkoutCompletion,
  WorkoutType
} from "@/lib/types"
import { Check, ChevronRight } from "lucide-react"

interface FitnessSummaryProps {
  date: string
  userId: string
}

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  'full_body': 'Full Body',
  'walk_mobility': 'Walk + Mobility',
  'rest': 'Rest Day',
  'optional': 'Optional',
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

export function FitnessSummary({ date, userId }: FitnessSummaryProps) {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Get day of week for the date
  const dayOfWeek = new Date(date + 'T00:00:00').getDay()

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setLoading(true)

      // Fetch food entries
      const { data: foodData } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('time', { ascending: true })

      if (foodData) {
        setFoodEntries(foodData)
      }

      // Fetch workout plan for this day
      const { data: planData } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek)
        .single()

      if (planData) {
        setWorkoutPlan(planData)

        // Fetch exercises for this workout type
        if (planData.workout_type !== 'rest') {
          const { data: exercisesData } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_type', planData.workout_type)
            .order('sort_order', { ascending: true })

          if (exercisesData) {
            setExercises(exercisesData)
          }
        }
      }

      // Fetch completions
      const { data: completionsData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)

      if (completionsData) {
        setCompletions(completionsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId, date, dayOfWeek])

  const completedCount = useMemo(() => {
    return exercises.filter(e => 
      completions.some(c => c.exercise_id === e.id)
    ).length
  }, [exercises, completions])

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-xs text-muted">Loading fitness data...</p>
      </div>
    )
  }

  // Don't render if no data exists
  const hasFood = foodEntries.length > 0
  const hasWorkoutPlan = workoutPlan !== null
  
  if (!hasFood && !hasWorkoutPlan) {
    return null
  }

  return (
    <div className="space-y-6 pt-6 border-t border-white/[0.06]">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-wider text-muted">Fitness</h2>
        <Link
          href={`/fitness`}
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted hover:text-secondary transition-colors"
        >
          Open <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Food Summary */}
      {hasFood && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-secondary">Food</span>
          <div className="space-y-1">
            {foodEntries.slice(0, 3).map(entry => (
              <div key={entry.id} className="flex items-baseline gap-3">
                <span className="text-[10px] text-muted tabular-nums">{formatTime(entry.time)}</span>
                <span className="text-xs text-secondary">
                  {entry.food_tags.join(', ')}
                </span>
              </div>
            ))}
            {foodEntries.length > 3 && (
              <p className="text-[10px] text-muted">+{foodEntries.length - 3} more entries</p>
            )}
          </div>
        </div>
      )}

      {/* Workout Summary */}
      {hasWorkoutPlan && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-secondary">Workout</span>
          
          {workoutPlan.workout_type === 'rest' ? (
            <p className="text-xs text-muted">Rest day</p>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">
                  {WORKOUT_TYPE_LABELS[workoutPlan.workout_type]}
                </span>
                <span className="text-[10px] text-muted">
                  {completedCount}/{exercises.length} done
                </span>
              </div>
              
              {/* Progress dots */}
              <div className="flex gap-1">
                {exercises.map(exercise => {
                  const isCompleted = completions.some(c => c.exercise_id === exercise.id)
                  return (
                    <div
                      key={exercise.id}
                      className={`w-2 h-2 rounded-full ${
                        isCompleted ? 'bg-white/20' : 'bg-white/[0.06]'
                      }`}
                      title={`${exercise.name}${isCompleted ? ' ✓' : ''}`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

