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
import { Check, ChevronRight, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface FitnessSummaryProps {
  date: string
  userId: string
}

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  'full_body': 'Full body',
  'walk_mobility': 'Walk & mobility',
  'rest': 'Rest day',
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
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)

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

  // Toggle exercise completion
  const handleExerciseToggle = async (exerciseId: string) => {
    if (!userId) return

    const existing = completions.find(c => c.exercise_id === exerciseId)
    
    if (existing) {
      // Delete completion
      const { error } = await supabase
        .from('workout_completions')
        .delete()
        .eq('id', existing.id)

      if (!error) {
        setCompletions(prev => prev.filter(c => c.id !== existing.id))
      }
    } else {
      // Add completion
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          user_id: userId,
          date: date,
          exercise_id: exerciseId,
          completed: true,
        })
        .select()
        .single()

      if (!error && data) {
        setCompletions(prev => [...prev, data])
      }
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-sm text-muted">Loading fitness data...</p>
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
        <h2 className="text-[11px] tracking-wide text-muted font-medium">Fitness</h2>
        <Link
          href={`/fitness`}
          className="flex items-center gap-1 text-xs tracking-wide text-muted hover:text-secondary transition-colors"
        >
          Open <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Food Summary */}
      {hasFood && (
        <div className="space-y-2">
          <span className="text-[11px] tracking-wide text-secondary font-medium">Food</span>
          <div className="space-y-1">
            {foodEntries.slice(0, 3).map(entry => (
              <div key={entry.id} className="flex items-baseline gap-3">
                <span className="text-xs text-muted tabular-nums">{formatTime(entry.time)}</span>
                <span className="text-xs text-secondary">
                  {entry.food_tags.join(', ')}
                </span>
              </div>
            ))}
            {foodEntries.length > 3 && (
              <p className="text-xs text-muted">+{foodEntries.length - 3} more entries</p>
            )}
          </div>
        </div>
      )}

      {/* Workout Summary */}
      {hasWorkoutPlan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-wide text-secondary font-medium">Workout</span>
            {workoutPlan.workout_type !== 'rest' && (
              <span className="text-xs text-muted">
                {completedCount}/{exercises.length} done
              </span>
            )}
          </div>
          
          {workoutPlan.workout_type === 'rest' ? (
            <p className="text-sm text-muted">Rest day</p>
          ) : exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.map(exercise => {
                const isCompleted = completions.some(c => c.exercise_id === exercise.id)
                
                return (
                  <div
                    key={exercise.id}
                    className={cn(
                      "group flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                      isCompleted 
                        ? "opacity-60 bg-white/[0.02]" 
                        : "hover:bg-white/[0.02]"
                    )}
                    onClick={(e) => {
                      // Don't open modal if clicking checkbox
                      if ((e.target as HTMLElement).closest('[data-slot="checkbox"]')) {
                        return
                      }
                      setSelectedExercise(exercise)
                    }}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleExerciseToggle(exercise.id)}
                        className={cn(
                          "rounded-full w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-300",
                          isCompleted 
                            ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                            : "border-white/20 bg-white/5 border-dashed hover:border-white/40"
                        )}
                      />
                    </div>
                    
                    {/* Image thumbnail */}
                    {exercise.image_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className={cn(
                          "text-xs font-medium leading-tight",
                          isCompleted ? 'text-muted line-through decoration-muted/50' : 'text-primary'
                        )}>
                          {exercise.name}
                        </h3>
                        {exercise.suggested_reps && (
                          <span className="text-xs text-muted flex-shrink-0">
                            {exercise.suggested_sets && exercise.suggested_sets > 1 
                              ? `${exercise.suggested_sets} × ${exercise.suggested_reps}`
                              : exercise.suggested_reps
                            }
                          </span>
                        )}
                      </div>
                      {exercise.description && (
                        <p className={cn(
                          "text-xs mt-0.5 leading-relaxed line-clamp-2",
                          isCompleted ? 'text-muted/50' : 'text-secondary'
                        )}>
                          {exercise.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">No exercises planned</p>
          )}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <div 
            className="bg-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            {selectedExercise.image_url && (
              <div className="w-full bg-white/5 relative flex items-center justify-center p-4">
                <img 
                  src={selectedExercise.image_url} 
                  alt={selectedExercise.name}
                  className="w-full h-auto object-contain"
                />
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary mb-1">
                    {selectedExercise.name}
                  </h3>
                  {selectedExercise.suggested_reps && (
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <span className="font-medium">
                        {selectedExercise.suggested_sets && selectedExercise.suggested_sets > 1 
                          ? `${selectedExercise.suggested_sets} sets × ${selectedExercise.suggested_reps}`
                          : selectedExercise.suggested_reps
                        }
                      </span>
                    </div>
                  )}
                </div>
                {!selectedExercise.image_url && (
                  <button 
                    onClick={() => setSelectedExercise(null)}
                    className="p-1 text-muted hover:text-primary transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {selectedExercise.description && (
                <div className="pt-2">
                  <p className="text-sm text-secondary leading-relaxed">
                    {selectedExercise.description}
                  </p>
                </div>
              )}

              {/* Completion toggle */}
              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  checked={completions.some(c => c.exercise_id === selectedExercise.id)}
                  onCheckedChange={() => {
                    handleExerciseToggle(selectedExercise.id)
                  }}
                  className={cn(
                    "rounded-full w-5 h-5",
                    completions.some(c => c.exercise_id === selectedExercise.id)
                      ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      : "border-white/20 bg-white/5 border-dashed hover:border-white/40"
                  )}
                />
                <label className="text-sm text-secondary cursor-pointer">
                  Mark as completed
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

