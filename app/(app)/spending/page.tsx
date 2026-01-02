"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day, SpendEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"

export default function SpendingPage() {
  const [days, setDays] = useState<Day[]>([])
  const [spendEntries, setSpendEntries] = useState<SpendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  // New entry form
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  // Fetch data
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
        .order('date', { ascending: false })

      if (!daysError && daysData) {
        setDays(daysData)

        // Fetch spend entries
        const dayIds = daysData.map(d => d.id)
        if (dayIds.length > 0) {
          const { data: spendData, error: spendError } = await supabase
            .from('spend_entries')
            .select('*')
            .in('day_id', dayIds)
            .order('created_at', { ascending: false })

          if (!spendError && spendData) {
            setSpendEntries(spendData)
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, userId, timeRange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSubmitting(true)

    try {
      // Find or create day
      let { data: dayData, error: dayError } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', userId)
        .eq('date', formDate)
        .single()

      if (dayError && dayError.code === 'PGRST116') {
        const { data: newDay, error: createError } = await supabase
          .from('days')
          .insert({ user_id: userId, date: formDate })
          .select()
          .single()

        if (!createError && newDay) {
          dayData = newDay
        }
      }

      if (dayData) {
        const { data: newEntry, error: entryError } = await supabase
          .from('spend_entries')
          .insert({
            user_id: userId,
            day_id: dayData.id,
            amount: parseFloat(formAmount),
            currency: 'USD',
            category: formCategory,
            description: formDescription || null,
          })
          .select()
          .single()

        if (!entryError && newEntry) {
          setSpendEntries([newEntry, ...spendEntries])
          setShowForm(false)
          setFormDate('')
          setFormAmount('')
          setFormCategory('')
          setFormDescription('')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('spend_entries')
      .delete()
      .eq('id', id)

    if (!error) {
      setSpendEntries(prev => prev.filter(e => e.id !== id))
    }
  }

  const totalSpent = useMemo(() => {
    return spendEntries.reduce((sum, entry) => sum + entry.amount, 0)
  }, [spendEntries])

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()
    spendEntries.forEach(entry => {
      totals.set(entry.category, (totals.get(entry.category) || 0) + entry.amount)
    })
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
  }, [spendEntries])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading spending...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Spending</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Entry'}
          </Button>
        </div>

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

        {/* New entry form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-md space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Date</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Category</label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Food, Transport, etc."
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Description (optional)</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What was this for?"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Adding...' : 'Add Entry'}
            </Button>
          </form>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-card border border-border rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-3xl font-semibold">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Entries</p>
            <p className="text-3xl font-semibold">{spendEntries.length}</p>
          </div>
        </div>

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">By Category</h2>
            <div className="space-y-2">
              {categoryTotals.map(([category, total]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-card border border-border rounded-md">
                  <span>{category}</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entries list */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Entries</h2>
          {spendEntries.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No entries yet</p>
          ) : (
            <div className="space-y-2">
              {spendEntries.map((entry) => {
                const day = days.find(d => d.id === entry.day_id)
                return (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${entry.amount.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">{entry.category}</span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{day?.date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

