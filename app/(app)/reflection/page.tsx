"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Day } from "@/lib/types"

export default function ReflectionPage() {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

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

  // Fetch days with notes/highlights
  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setLoading(true)

      const { data: daysData, error } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', userId)
        .or('highlights.not.is.null,notes.not.is.null')
        .order('date', { ascending: false })
        .limit(50)

      if (!error && daysData) {
        // Filter out days with empty strings
        const filtered = daysData.filter(d => 
          (d.highlights && d.highlights.trim()) || (d.notes && d.notes.trim())
        )
        setDays(filtered)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      year: date.getFullYear(),
    }
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
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="pb-6 border-b border-white/[0.06]">
          <h1 className="text-2xl font-light tracking-tight text-primary">Reflections</h1>
          <p className="text-xs text-muted mt-2">
            {days.length} {days.length === 1 ? 'entry' : 'entries'}
          </p>
        </header>

        {days.length === 0 ? (
          <p className="text-center py-12 text-muted text-sm">
            No reflections yet. Add highlights or notes to your days.
          </p>
        ) : (
          <div className="space-y-0">
            {days.map((day, index) => {
              const { day: dayNum, month, weekday } = formatDate(day.date)
              const isLast = index === days.length - 1
              
              return (
                <div 
                  key={day.id} 
                  className={`py-6 ${!isLast ? 'border-b border-white/[0.03]' : ''} cursor-pointer group`}
                  onClick={() => router.push(`/today?date=${day.date}`)}
                >
                  {/* Date */}
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-2xl font-light text-primary tabular-nums">
                      {dayNum}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      {month}
                    </span>
                    <span className="text-xs text-muted group-hover:text-secondary transition-colors">
                      {weekday}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 pl-0">
                    {day.highlights && day.highlights.trim() && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted">Highlights</span>
                        <p className="text-sm text-secondary mt-1">{day.highlights}</p>
                      </div>
                    )}

                    {day.notes && day.notes.trim() && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted">Notes</span>
                        <p className="text-sm text-secondary mt-1 whitespace-pre-wrap">{day.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
