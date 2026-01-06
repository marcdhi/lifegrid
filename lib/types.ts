// Database types
export interface User {
  id: string
  email: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface Day {
  id: string
  user_id: string
  date: string // DATE string (YYYY-MM-DD)
  weight?: number
  highlights?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface HourLog {
  id: string
  user_id: string
  day_id: string
  hour: number // 0-23 (start time)
  start_offset: number // 0-59 (minute offset)
  duration_minutes: number // how long the block lasts (default 60)
  category_id: string
  category?: Category // Joined from categories table
  task_id?: string // Linked task if any
  note?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  day_id: string
  category_id: string
  category?: Category
  title: string
  completed: boolean
  notes?: string
  is_recurring: boolean
  template_task_id?: string
  created_at: string
  updated_at: string
}

export interface SpendEntry {
  id: string
  user_id: string
  day_id: string
  amount: number
  currency: string
  category: string
  description?: string
  created_at: string
  updated_at: string
}

export interface FoodLog {
  id: string
  user_id: string
  day_id: string
  name: string
  location?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface MediaLog {
  id: string
  user_id: string
  day_id: string
  type: 'book' | 'movie' | 'tv' | 'podcast' | 'music' | 'game' | 'article'
  title: string
  rating?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Travel {
  id: string
  user_id: string
  trip_name: string
  start_date: string // DATE string
  end_date: string // DATE string
  location: string
  notes?: string
  created_at: string
  updated_at: string
}

// UI types
export interface HourCellData {
  hour: number
  category?: Category
  note?: string
  logId?: string
}

export interface DayWithLogs extends Day {
  hour_logs?: HourLog[]
  tasks?: Task[]
  spend_entries?: SpendEntry[]
  food_logs?: FoodLog[]
  media_logs?: MediaLog[]
}

// ==================
// FITNESS TYPES
// ==================

export type FitnessGoal = 'get_active' | 'lose_weight' | 'build_strength' | 'stay_healthy'
export type WorkoutType = 'full_body' | 'walk_mobility' | 'rest' | 'optional'

export interface FitnessProfile {
  id: string
  user_id: string
  age?: number
  height_cm?: number
  weight_kg?: number
  goal?: FitnessGoal
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface FoodTag {
  id: string
  user_id: string
  name: string
  use_count: number
  created_at: string
  updated_at: string
}

export interface FoodEntry {
  id: string
  user_id: string
  date: string // DATE string (YYYY-MM-DD)
  time: string // TIME string (HH:MM:SS or HH:MM)
  food_tags: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  workout_type: WorkoutType
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutExercise {
  id: string
  name: string
  description: string
  workout_type: WorkoutType
  suggested_reps?: string
  suggested_sets?: number
  sort_order: number
  image_url?: string
  created_at: string
}

export interface WorkoutCompletion {
  id: string
  user_id: string
  date: string // DATE string (YYYY-MM-DD)
  exercise_id: string
  completed: boolean
  duration_minutes?: number
  notes?: string
  created_at: string
  updated_at: string
}

// Utility types for fitness
export interface DayFitnessSummary {
  date: string
  food_entries: FoodEntry[]
  workout_plan?: WorkoutPlan
  workout_completions: WorkoutCompletion[]
  exercises: WorkoutExercise[]
}

// ==================
// FRIENDS SYSTEM TYPES
// ==================

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface UserPrivacySettings {
  id: string
  user_id: string
  fitness_public: boolean
  analytics_public: boolean
  schedule_public: boolean
  grid_public: boolean
  created_at: string
  updated_at: string
}

