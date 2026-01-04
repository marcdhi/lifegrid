import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string to Date object
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get today's date in user's timezone as YYYY-MM-DD
 */
export function getTodayString(): string {
  return formatDateString(new Date())
}

/**
 * Format hour as human-readable time (e.g., "9 AM", "12 PM")
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

/**
 * Get display label for a date (e.g., "Today", "Yesterday", or formatted date)
 */
export function getDateLabel(dateString: string): string {
  const today = getTodayString()
  const yesterday = formatDateString(new Date(Date.now() - 86400000))
  
  if (dateString === today) return 'Today'
  if (dateString === yesterday) return 'Yesterday'
  
  const date = parseDateString(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Generate array of all hours (0-23)
 */
export function getAllHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i)
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Filter categories to hide system categories if user has custom ones with same name (case-insensitive)
 */
export function filterCategoriesForUser<T extends { user_id?: string | null; name: string }>(
  categories: T[],
  userId: string | null
): T[] {
  if (!userId) return categories

  // Get user's custom category names (case-insensitive)
  const userCategoryNames = new Set(
    categories
      .filter(c => c.user_id === userId)
      .map(c => c.name.toLowerCase())
  )
  
  // Filter: show system categories only if user doesn't have a custom one with same name
  return categories.filter(c => {
    if (c.user_id === userId) return true // Always show user's own categories
    if (!c.user_id) {
      // System category - only show if user doesn't have custom one with same name
      return !userCategoryNames.has(c.name.toLowerCase())
    }
    return false // Don't show other users' categories
  })
}
