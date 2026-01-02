"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day, HourLog, Category } from "@/lib/types"

export default function AnalyticsPage() {
  const [days, setDays] = useState<Day[]>([])
  const [hourLogs, setHourLogs] = useState<HourLog[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

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
        setCategories(data)
      }
    }
    fetchCategories()
  }, [supabase])

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

      const startDateString = startDate.toISOString().split('T')[0]
      const endDateString = now.toISOString().split('T')[0]

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
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId, timeRange])

  // Calculate category breakdowns
  const categoryStats = useMemo(() => {
    const stats = categories.map(category => {
      const hoursLogged = hourLogs.filter(log => log.category_id === category.id).length
      const percentage = hourLogs.length > 0 ? (hoursLogged / hourLogs.length) * 100 : 0

      return {
        category,
        hours: hoursLogged,
        percentage,
      }
    })

    return stats.sort((a, b) => b.hours - a.hours)
  }, [categories, hourLogs])

  const totalHoursLogged = hourLogs.length
  const daysWithData = days.filter(d => {
    const dayLogs = hourLogs.filter(log => log.day_id === d.id)
    return dayLogs.length > 0
  }).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          
          {/* Time range selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {range === 'week' ? 'Last 7 days' : range === 'month' ? 'Last 30 days' : 'This year'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 bg-card border border-border rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Total Hours Logged</p>
            <p className="text-3xl font-semibold">{totalHoursLogged}</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Days with Data</p>
            <p className="text-3xl font-semibold">{daysWithData}</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Avg Hours/Day</p>
            <p className="text-3xl font-semibold">
              {daysWithData > 0 ? (totalHoursLogged / daysWithData).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Category Breakdown</h2>
          <div className="space-y-3">
            {categoryStats.map(({ category, hours, percentage }) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {hours}h ({percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observations */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground italic">
            This is an observational tool. There are no goals, no targets, no judgments.
          </p>
        </div>
      </div>
    </div>
  )
}

