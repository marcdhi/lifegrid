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
  hour: number // 0-23
  category_id: string
  note?: string
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
  spend_entries?: SpendEntry[]
  food_logs?: FoodLog[]
  media_logs?: MediaLog[]
}

