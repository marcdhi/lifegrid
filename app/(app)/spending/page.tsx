"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Day, SpendEntry } from "@/lib/types"
import { Trash2, Plus, X } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { DatePicker } from "@/components/ui/date-picker"
import { TextField } from "@/components/ui/text-field"
import { IconButton } from "@/components/ui/icon-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

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

  // Category autocomplete
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  
  const supabase = createClient()

  // Get unique categories from existing entries
  const existingCategories = useMemo(() => {
    const categories = new Set(spendEntries.map(e => e.category))
    return Array.from(categories).sort()
  }, [spendEntries])

  const categorySuggestions = useMemo(() => {
    if (!formCategory.trim()) return []
    return existingCategories.filter(cat => 
      cat.toLowerCase().includes(formCategory.toLowerCase())
    ).slice(0, 5)
  }, [formCategory, existingCategories])

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
        <PageHeader
          title={
            <span className="text-4xl font-light tracking-tight text-primary tabular-nums">
              {formatCurrency(totalSpent)}
            </span>
          }
          subtitle={timeRange === 'week' ? 'Last 7 days' : timeRange === 'month' ? 'Last 30 days' : 'This year'}
          actions={
            <IconButton onClick={() => setShowForm(!showForm)}>
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </IconButton>
          }
        />

        {/* Time range selector */}
        <nav className="flex gap-4">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-sm tracking-wide transition-colors rounded-lg px-3 py-1.5 ${
                timeRange === range
                  ? 'text-primary bg-white/[0.04]'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              {range === 'week' ? '7 days' : range === 'month' ? '30 days' : 'Year'}
            </button>
          ))}
        </nav>

        {/* New entry form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 pb-6 border-b border-white/[0.06] animate-fade">
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
              <TextField
                label="Amount (₹)"
                type="number"
                step="1"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-1 relative">
              <TextField
                label="Category"
                value={formCategory}
                onChange={(e) => {
                  setFormCategory(e.target.value)
                  setShowCategorySuggestions(e.target.value.trim().length > 0)
                }}
                onFocus={() => formCategory.trim() && setShowCategorySuggestions(true)}
                placeholder="Food, Transport, etc."
                required
              />
              
              {/* Category autocomplete */}
              {showCategorySuggestions && categorySuggestions.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCategorySuggestions(false)}
                  />
                  <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-popover border border-white/[0.06] rounded-lg overflow-hidden shadow-lg">
                    {categorySuggestions.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setFormCategory(category)
                          setShowCategorySuggestions(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-secondary hover:bg-white/[0.04] transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <TextField
              label="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Optional"
            />
            
            <Button
              type="submit"
              disabled={submitting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="size-4" />
              {submitting ? 'Adding...' : 'Add entry'}
            </Button>
          </form>
        )}

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <div className="space-y-3">
            <SectionHeader>By category</SectionHeader>
            <div className="space-y-3">
              {categoryTotals.map(([category, total]) => {
                const percentage = (total / totalSpent) * 100
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-secondary">{category}</span>
                      <span className="text-sm text-muted tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
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

        {/* Entries list */}
        <div className="space-y-4">
          <SectionHeader>Entries</SectionHeader>
          {spendEntries.length === 0 ? (
            <EmptyState title="No entries yet" />
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
                        <span className="text-sm text-muted truncate">{entry.category}</span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted mt-0.5 truncate">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted tabular-nums">{day?.date}</span>
                      <IconButton
                        onClick={() => handleDelete(entry.id)}
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </IconButton>
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
