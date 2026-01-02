"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day } from "@/lib/types"

export default function ReflectionPage() {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

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
        setDays(daysData)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading reflections...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Reflection</h1>

        {days.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            No reflections yet. Add highlights or notes to your days.
          </p>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day.id} className="p-6 bg-card border border-border rounded-md space-y-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-medium">{day.date}</h2>
                  <span className="text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {day.highlights && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Highlights</p>
                    <p className="text-foreground">{day.highlights}</p>
                  </div>
                )}

                {day.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{day.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

