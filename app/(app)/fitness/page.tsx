"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { getTodayString } from "@/lib/utils"
import type { 
  FitnessProfile, 
  FoodEntry, 
  FoodTag, 
  WorkoutPlan, 
  WorkoutExercise, 
  WorkoutCompletion,
  FitnessGoal,
  WorkoutType
} from "@/lib/types"
import { ChevronLeft, ChevronRight, Plus, X, Check, Trash2 } from "lucide-react"

// Default workout plan for beginners
const DEFAULT_WORKOUT_PLAN: { day: number; type: WorkoutType }[] = [
  { day: 0, type: 'rest' },       // Sunday
  { day: 1, type: 'full_body' },  // Monday
  { day: 2, type: 'walk_mobility' }, // Tuesday
  { day: 3, type: 'rest' },       // Wednesday
  { day: 4, type: 'full_body' },  // Thursday
  { day: 5, type: 'walk_mobility' }, // Friday
  { day: 6, type: 'optional' },   // Saturday
]

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  'full_body': 'Full Body',
  'walk_mobility': 'Walk + Mobility',
  'rest': 'Rest Day',
  'optional': 'Optional',
}

const GOAL_OPTIONS: { value: FitnessGoal; label: string; description: string }[] = [
  { value: 'get_active', label: 'Get Active', description: 'Start moving more regularly' },
  { value: 'lose_weight', label: 'Lose Weight', description: 'Gradual, sustainable progress' },
  { value: 'build_strength', label: 'Build Strength', description: 'Basic strength foundation' },
  { value: 'stay_healthy', label: 'Stay Healthy', description: 'General wellness maintenance' },
]

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export default function FitnessPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState<string>(getTodayString())
  
  // Profile & Onboarding
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState({
    age: '',
    height_cm: '',
    weight_kg: '',
    goal: '' as FitnessGoal | '',
  })
  
  // Food
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [foodTags, setFoodTags] = useState<FoodTag[]>([])
  const [showFoodForm, setShowFoodForm] = useState(false)
  const [foodFormTime, setFoodFormTime] = useState(getCurrentTime())
  const [foodFormTags, setFoodFormTags] = useState<string[]>([])
  const [foodFormNotes, setFoodFormNotes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<FoodTag[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  
  // Workout
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([])
  
  const supabase = createClient()

  // Get current day's workout type
  const currentDayOfWeek = new Date(currentDate + 'T00:00:00').getDay()
  const todaysPlan = workoutPlans.find(p => p.day_of_week === currentDayOfWeek)
  const todaysExercises = useMemo(() => {
    if (!todaysPlan || todaysPlan.workout_type === 'rest') return []
    return exercises.filter(e => e.workout_type === todaysPlan.workout_type)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [todaysPlan, exercises])

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

  // Fetch all data
  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setLoading(true)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('fitness_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        setShowOnboarding(!profileData.onboarding_completed)
      } else {
        setShowOnboarding(true)
      }

      // Fetch food tags
      const { data: tagsData } = await supabase
        .from('food_tags')
        .select('*')
        .eq('user_id', userId)
        .order('use_count', { ascending: false })

      if (tagsData) {
        setFoodTags(tagsData)
      }

      // Fetch workout plans
      const { data: plansData } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)

      if (plansData && plansData.length > 0) {
        setWorkoutPlans(plansData)
      }

      // Fetch exercises
      const { data: exercisesData } = await supabase
        .from('workout_exercises')
        .select('*')
        .order('sort_order', { ascending: true })

      if (exercisesData) {
        setExercises(exercisesData)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId])

  // Fetch date-specific data
  useEffect(() => {
    if (!userId) return

    const fetchDateData = async () => {
      // Fetch food entries for date
      const { data: foodData } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', currentDate)
        .order('time', { ascending: true })

      if (foodData) {
        setFoodEntries(foodData)
      }

      // Fetch completions for date
      const { data: completionsData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', currentDate)

      if (completionsData) {
        setCompletions(completionsData)
      }
    }

    fetchDateData()
  }, [supabase, userId, currentDate])

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    if (!userId) return

    const profilePayload = {
      user_id: userId,
      age: onboardingData.age ? parseInt(onboardingData.age) : null,
      height_cm: onboardingData.height_cm ? parseFloat(onboardingData.height_cm) : null,
      weight_kg: onboardingData.weight_kg ? parseFloat(onboardingData.weight_kg) : null,
      goal: onboardingData.goal || null,
      onboarding_completed: true,
    }

    if (profile) {
      // Update existing
      const { data } = await supabase
        .from('fitness_profiles')
        .update(profilePayload)
        .eq('id', profile.id)
        .select()
        .single()

      if (data) setProfile(data)
    } else {
      // Insert new
      const { data } = await supabase
        .from('fitness_profiles')
        .insert(profilePayload)
        .select()
        .single()

      if (data) setProfile(data)
    }

    // Create default workout plan if none exists
    if (workoutPlans.length === 0) {
      const planPayload = DEFAULT_WORKOUT_PLAN.map(p => ({
        user_id: userId,
        day_of_week: p.day,
        workout_type: p.type,
        is_active: true,
      }))

      const { data: newPlans } = await supabase
        .from('workout_plans')
        .insert(planPayload)
        .select()

      if (newPlans) setWorkoutPlans(newPlans)
    }

    setShowOnboarding(false)
  }

  // Handle skipping onboarding
  const handleSkipOnboarding = async () => {
    if (!userId) return

    const { data } = await supabase
      .from('fitness_profiles')
      .insert({
        user_id: userId,
        onboarding_completed: true,
      })
      .select()
      .single()

    if (data) setProfile(data)

    // Create default workout plan
    const planPayload = DEFAULT_WORKOUT_PLAN.map(p => ({
      user_id: userId,
      day_of_week: p.day,
      workout_type: p.type,
      is_active: true,
    }))

    const { data: newPlans } = await supabase
      .from('workout_plans')
      .insert(planPayload)
      .select()

    if (newPlans) setWorkoutPlans(newPlans)

    setShowOnboarding(false)
  }

  // Food tag autocomplete
  const handleTagInputChange = useCallback((value: string) => {
    setTagInput(value)
    if (value.trim()) {
      const filtered = foodTags.filter(t => 
        t.name.toLowerCase().includes(value.toLowerCase()) &&
        !foodFormTags.includes(t.name)
      ).slice(0, 5)
      setTagSuggestions(filtered)
      setShowTagSuggestions(filtered.length > 0)
    } else {
      setTagSuggestions([])
      setShowTagSuggestions(false)
    }
  }, [foodTags, foodFormTags])

  const addTag = useCallback((tagName: string) => {
    const normalized = tagName.trim().toLowerCase()
    if (normalized && !foodFormTags.includes(normalized)) {
      setFoodFormTags(prev => [...prev, normalized])
    }
    setTagInput('')
    setShowTagSuggestions(false)
    tagInputRef.current?.focus()
  }, [foodFormTags])

  const removeTag = useCallback((tagName: string) => {
    setFoodFormTags(prev => prev.filter(t => t !== tagName))
  }, [])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && foodFormTags.length > 0) {
      setFoodFormTags(prev => prev.slice(0, -1))
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false)
    }
  }

  // Submit food entry
  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || foodFormTags.length === 0) return

    const { data: newEntry, error } = await supabase
      .from('food_entries')
      .insert({
        user_id: userId,
        date: currentDate,
        time: foodFormTime,
        food_tags: foodFormTags,
        notes: foodFormNotes || null,
      })
      .select()
      .single()

    if (!error && newEntry) {
      setFoodEntries(prev => [...prev, newEntry].sort((a, b) => a.time.localeCompare(b.time)))
      
      // Update tag counts
      for (const tagName of foodFormTags) {
        const existingTag = foodTags.find(t => t.name === tagName)
        if (existingTag) {
          await supabase
            .from('food_tags')
            .update({ use_count: existingTag.use_count + 1 })
            .eq('id', existingTag.id)
        } else {
          const { data: newTag } = await supabase
            .from('food_tags')
            .insert({ user_id: userId, name: tagName })
            .select()
            .single()
          if (newTag) setFoodTags(prev => [...prev, newTag])
        }
      }

      // Reset form
      setShowFoodForm(false)
      setFoodFormTime(getCurrentTime())
      setFoodFormTags([])
      setFoodFormNotes('')
    }
  }

  // Delete food entry
  const handleDeleteFood = async (id: string) => {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)

    if (!error) {
      setFoodEntries(prev => prev.filter(e => e.id !== id))
    }
  }

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
          date: currentDate,
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

  // Navigation
  const navigateDay = (offset: number) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + offset)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setCurrentDate(`${year}-${month}-${day}`)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  // Onboarding Screen
  if (showOnboarding) {
    return (
      <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-2xl font-light tracking-tight text-primary">
              Welcome to Fitness
            </h1>
            <p className="text-xs text-muted">
              A gentle structure for building healthy habits
            </p>
          </header>

          {onboardingStep === 0 && (
            <div className="space-y-6 animate-fade">
              <p className="text-sm text-secondary text-center">
                This is not a hardcore fitness app. No streak pressure, no calorie counting, no judgment.
              </p>
              <p className="text-sm text-secondary text-center">
                Just a simple way to track what you eat and stay active.
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="w-full py-3 text-[11px] uppercase tracking-wider text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-sm transition-colors"
                >
                  Set up my profile
                </button>
                <button
                  onClick={handleSkipOnboarding}
                  className="text-[11px] uppercase tracking-wider text-muted hover:text-secondary transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="space-y-6 animate-fade">
              <p className="text-xs text-muted text-center">
                All fields are optional. Share what feels comfortable.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted">Age</label>
                  <input
                    type="number"
                    value={onboardingData.age}
                    onChange={(e) => setOnboardingData({ ...onboardingData, age: e.target.value })}
                    placeholder="Optional"
                    className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted">Height (cm)</label>
                    <input
                      type="number"
                      value={onboardingData.height_cm}
                      onChange={(e) => setOnboardingData({ ...onboardingData, height_cm: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted">Weight (kg)</label>
                    <input
                      type="number"
                      value={onboardingData.weight_kg}
                      onChange={(e) => setOnboardingData({ ...onboardingData, weight_kg: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setOnboardingStep(0)}
                  className="text-[11px] uppercase tracking-wider text-muted hover:text-secondary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="flex-1 py-2 text-[11px] uppercase tracking-wider text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-sm transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-6 animate-fade">
              <p className="text-xs text-muted text-center">
                What feels right for you right now?
              </p>
              
              <div className="space-y-2">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setOnboardingData({ ...onboardingData, goal: goal.value })}
                    className={`w-full text-left px-4 py-3 rounded-sm transition-colors ${
                      onboardingData.goal === goal.value
                        ? 'bg-white/[0.06] border border-white/[0.12]'
                        : 'border border-transparent hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-sm text-primary">{goal.label}</span>
                    <p className="text-xs text-muted mt-0.5">{goal.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="text-[11px] uppercase tracking-wider text-muted hover:text-secondary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleOnboardingComplete}
                  className="flex-1 py-2 text-[11px] uppercase tracking-wider text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-sm transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Fitness View
  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header with date navigation */}
        <header className="flex items-end justify-between pb-6 border-b border-white/[0.06]">
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-light tracking-tighter text-primary tabular-nums">
              {dayNum}
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">{month}</span>
              <span className="text-sm text-secondary">{weekday}</span>
            </div>
          </div>
          
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

        {/* Food Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-wider text-muted">Food</h2>
            <button
              onClick={() => setShowFoodForm(!showFoodForm)}
              className="p-1 text-muted hover:text-secondary transition-colors"
              aria-label={showFoodForm ? 'Cancel' : 'Add food'}
            >
              {showFoodForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Food Form */}
          {showFoodForm && (
            <form onSubmit={handleFoodSubmit} className="space-y-4 pb-4 border-b border-white/[0.06] animate-fade">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted">Time</label>
                <input
                  type="time"
                  value={foodFormTime}
                  onChange={(e) => setFoodFormTime(e.target.value)}
                  required
                  className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] uppercase tracking-wider text-muted">What did you eat?</label>
                
                {/* Tags display */}
                {foodFormTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {foodFormTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-secondary bg-white/[0.04] rounded-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-muted hover:text-primary transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag input */}
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => tagInput.trim() && setShowTagSuggestions(tagSuggestions.length > 0)}
                  placeholder={foodFormTags.length === 0 ? "Type food name and press Enter" : "Add more..."}
                  className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
                />

                {/* Autocomplete dropdown */}
                {showTagSuggestions && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-[#0A0A0A] border border-white/[0.06] rounded-sm overflow-hidden">
                    {tagSuggestions.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addTag(tag.name)}
                        className="w-full text-left px-3 py-2 text-sm text-secondary hover:bg-white/[0.04] transition-colors"
                      >
                        {tag.name}
                        <span className="text-xs text-muted ml-2">({tag.use_count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted">Notes (optional)</label>
                <input
                  type="text"
                  value={foodFormNotes}
                  onChange={(e) => setFoodFormNotes(e.target.value)}
                  placeholder="Any context..."
                  className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
                />
              </div>

              <button
                type="submit"
                disabled={foodFormTags.length === 0}
                className="text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Entry
              </button>
            </form>
          )}

          {/* Food entries list */}
          {foodEntries.length === 0 ? (
            <p className="text-sm text-muted py-4">No food logged yet</p>
          ) : (
            <div className="space-y-2">
              {foodEntries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between py-2 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs text-muted tabular-nums">{formatTime(entry.time)}</span>
                      <div className="flex flex-wrap gap-1">
                        {entry.food_tags.map(tag => (
                          <span key={tag} className="text-sm text-secondary">{tag}</span>
                        ))}
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-muted mt-0.5 ml-14">{entry.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFood(entry.id)}
                    className="p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Workout Section */}
        <section className="space-y-4 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-wider text-muted">
              Workout
              {todaysPlan && (
                <span className="text-secondary ml-2">
                  — {WORKOUT_TYPE_LABELS[todaysPlan.workout_type]}
                </span>
              )}
            </h2>
          </div>

          {!todaysPlan || todaysPlan.workout_type === 'rest' ? (
            <div className="py-8 text-center">
              <p className="text-sm text-secondary">Rest day</p>
              <p className="text-xs text-muted mt-1">Take it easy. Recovery is part of the process.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysExercises.map(exercise => {
                const isCompleted = completions.some(c => c.exercise_id === exercise.id)
                
                return (
                  <div
                    key={exercise.id}
                    className={`p-4 rounded-sm border transition-colors ${
                      isCompleted
                        ? 'border-white/[0.08] bg-white/[0.02]'
                        : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleExerciseToggle(exercise.id)}
                        className={`mt-0.5 w-5 h-5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-white/[0.1] border-white/[0.2] text-primary'
                            : 'border-white/[0.1] hover:border-white/[0.2]'
                        }`}
                      >
                        {isCompleted && <Check className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className={`text-sm font-medium ${isCompleted ? 'text-secondary' : 'text-primary'}`}>
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
                        <p className={`text-xs mt-1 ${isCompleted ? 'text-muted' : 'text-secondary'}`}>
                          {exercise.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {todaysExercises.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted text-center">
                    {completions.length} of {todaysExercises.length} completed — No pressure.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Weekly Overview */}
        <section className="pt-6 border-t border-white/[0.06]">
          <h2 className="text-[10px] uppercase tracking-wider text-muted mb-4">This Week</h2>
          <div className="flex gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLabel, index) => {
              const plan = workoutPlans.find(p => p.day_of_week === index)
              const isToday = index === currentDayOfWeek
              
              return (
                <div
                  key={index}
                  className={`flex-1 text-center py-2 rounded-sm ${
                    isToday ? 'bg-white/[0.04]' : ''
                  }`}
                >
                  <span className={`text-[10px] uppercase ${isToday ? 'text-primary' : 'text-muted'}`}>
                    {dayLabel}
                  </span>
                  <div className="mt-1">
                    {plan?.workout_type === 'rest' ? (
                      <span className="text-[10px] text-muted">—</span>
                    ) : plan?.workout_type === 'optional' ? (
                      <span className="text-[10px] text-muted">○</span>
                    ) : plan ? (
                      <span className={`text-[10px] ${isToday ? 'text-secondary' : 'text-muted'}`}>●</span>
                    ) : (
                      <span className="text-[10px] text-muted">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Philosophy footer */}
        <div className="pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-muted italic text-center">
            The system guides, you decide. No judgment, no streaks, just consistency.
          </p>
        </div>
      </div>
    </div>
  )
}

