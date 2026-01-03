"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day, SpendEntry } from "@/lib/types"
import { Trash2, Plus, X } from "lucide-react"

// Format currency with Indian locale
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

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
        } else {
          setSpendEntries([])
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
            currency: 'INR',
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
        <p className="text-muted">Loading spending...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-end justify-between pb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-4xl font-light tracking-tighter text-primary tabular-nums">
              {formatCurrency(totalSpent)}
            </span>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">
              {timeRange === 'week' ? 'Last 7 days' : timeRange === 'month' ? 'Last 30 days' : 'This year'}
            </p>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 text-muted hover:text-secondary transition-colors"
            aria-label={showForm ? 'Cancel' : 'Add entry'}
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </header>

        {/* Time range selector - minimal */}
        <nav className="flex gap-4">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-[11px] uppercase tracking-wider transition-colors ${
                timeRange === range
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              {range === 'week' ? '7 days' : range === 'month' ? '30 days' : 'Year'}
            </button>
          ))}
        </nav>

        {/* New entry form - inline, minimal */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 pb-6 border-b border-white/[0.06] animate-fade">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted">Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted">Category</label>
              <input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Food, Transport, etc."
                required
                className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted">Description</label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional"
                className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </form>
        )}

        {/* Category breakdown - bar visualization */}
        {categoryTotals.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-wider text-muted">By Category</h2>
            <div className="space-y-2">
              {categoryTotals.map(([category, total]) => {
                const percentage = (total / totalSpent) * 100
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-secondary">{category}</span>
                      <span className="text-xs text-muted tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/20 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Entries list - minimal */}
        <div className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-wider text-muted">Entries</h2>
          {spendEntries.length === 0 ? (
            <p className="text-center py-12 text-muted text-sm">No entries yet</p>
          ) : (
            <div className="space-y-1">
              {spendEntries.map((entry) => {
                const day = days.find(d => d.id === entry.day_id)
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between py-3 border-b border-white/[0.03] group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm text-primary tabular-nums">
                          {formatCurrency(entry.amount)}
                        </span>
                        <span className="text-xs text-muted truncate">{entry.category}</span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-muted mt-0.5 truncate">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-muted tabular-nums">{day?.date}</span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
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
