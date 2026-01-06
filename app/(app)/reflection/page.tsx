"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Day } from "@/lib/types"
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"

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
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
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
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          title="Reflections"
          subtitle={`${days.length} ${days.length === 1 ? 'entry' : 'entries'}`}
        />

        {days.length === 0 ? (
          <EmptyState
            title="No reflections yet"
            description="Add highlights or notes to your days to see them here"
          />
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const { day: dayNum, month, year, weekday } = formatDate(day.date)
              
              return (
                <Card
                  key={day.id}
                  variant="interactive"
                  className="hover:border-white/[0.12] transition-all"
                  onClick={() => router.push(`/today?date=${day.date}`)}
                >
                  {/* Date header */}
                  <div className="flex items-end gap-4 mb-4">
                    <span className="text-4xl font-light text-primary tabular-nums leading-none">
                      {dayNum}
                    </span>
                    <div className="flex flex-col justify-end pb-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-light text-primary">{month}</span>
                        <span className="text-sm text-muted tabular-nums">{year}</span>
                      </div>
                      <span className="text-sm text-secondary">{weekday}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    {day.highlights && day.highlights.trim() && (
                      <div>
                        <span className="text-sm tracking-wide text-muted font-medium block mb-1.5">
                          Highlights
                        </span>
                        <p className="text-sm text-secondary leading-relaxed">{day.highlights}</p>
                      </div>
                    )}

                    {day.notes && day.notes.trim() && (
                      <div>
                        <span className="text-sm tracking-wide text-muted font-medium block mb-1.5">
                          Notes
                        </span>
                        <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                          {day.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Philosophy */}
        {days.length > 0 && (
          <div className="pt-6 border-t border-white/[0.06]">
            <p className="text-sm text-muted italic text-center">
              Your thoughts, preserved. No formatting, no pressure, just you.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
