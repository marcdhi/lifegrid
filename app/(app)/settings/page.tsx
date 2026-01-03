"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Download, Check } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { TextField } from "@/components/ui/text-field"
import { Card } from "@/components/ui/card"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!error && userData) {
          setUser(userData)
          setTimezone(userData.timezone)
        }
      }

      setLoading(false)
    }

    fetchUser()
  }, [supabase])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('users')
      .update({ timezone })
      .eq('id', user.id)

    if (error) {
      setMessage('Failed to save')
    } else {
      setMessage('Saved')
      setUser({ ...user, timezone })
      // Clear message after 2 seconds
      setTimeout(() => setMessage(null), 2000)
    }

    setSaving(false)
  }

  const handleExportData = async (format: 'json' | 'csv') => {
    if (!user) return

    try {
      // Fetch all user data
      const [daysRes, logsRes, spendRes, foodRes, workoutRes] = await Promise.all([
        supabase.from('days').select('*').eq('user_id', user.id),
        supabase.from('hour_logs').select('*').eq('user_id', user.id),
        supabase.from('spend_entries').select('*').eq('user_id', user.id),
        supabase.from('food_entries').select('*').eq('user_id', user.id),
        supabase.from('workout_completions').select('*').eq('user_id', user.id),
      ])

      const data = {
        days: daysRes.data || [],
        hour_logs: logsRes.data || [],
        spend_entries: spendRes.data || [],
        food_entries: foodRes.data || [],
        workout_completions: workoutRes.data || [],
        exported_at: new Date().toISOString(),
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `lifegrid-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // CSV export for hour logs
        const csvRows = ['Date,Hour,Duration Minutes,Category ID,Note']
        logsRes.data?.forEach(log => {
          const day = daysRes.data?.find(d => d.id === log.day_id)
          csvRows.push(`${day?.date || ''},${log.hour},${log.duration_minutes || 60},${log.category_id},"${log.note || ''}"`)
        })
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `lifegrid-hours-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }

      setMessage(`Exported as ${format.toUpperCase()}`)
      setTimeout(() => setMessage(null), 2000)
    } catch {
      setMessage('Export failed')
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
        <PageHeader title="Settings" />

        {/* Account */}
        <section className="space-y-4">
          <SectionHeader>Account</SectionHeader>
          <Card>
            <div className="space-y-1">
              <span className="text-xs tracking-wide text-muted font-medium">Email</span>
              <p className="text-sm text-secondary">{user?.email}</p>
            </div>
          </Card>
        </section>

        {/* Timezone */}
        <section className="space-y-4">
          <SectionHeader>Timezone</SectionHeader>
          <Card>
            <div className="space-y-4">
              <TextField
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g., Asia/Kolkata"
              />
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-xs tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save timezone'}
                </button>
                {message === 'Saved' && (
                  <span className="flex items-center gap-1.5 text-xs text-secondary">
                    <Check className="w-3.5 h-3.5" /> {message}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted">
                All timestamps are stored in UTC. Changing timezone only affects display.
              </p>
            </div>
          </Card>
        </section>

        {/* Export */}
        <section className="space-y-4">
          <SectionHeader>Export data</SectionHeader>
          <Card>
            <div className="space-y-4">
              <p className="text-xs text-muted">
                Download all your Lifegrid data. You own your data completely.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportData('json')}
                  className="flex items-center gap-2 px-4 py-2 text-xs tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </button>
                <button
                  onClick={() => handleExportData('csv')}
                  className="flex items-center gap-2 px-4 py-2 text-xs tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
          </Card>
        </section>

        {/* Philosophy */}
        <div className="pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-muted italic text-center">
            Your data lives with you. Export it anytime, delete your account whenever you want.
          </p>
        </div>

        {/* Message toast */}
        {message && message !== 'Saved' && (
          <div className="fixed bottom-6 right-6 px-4 py-3 bg-popover border border-white/[0.06] rounded-xl animate-fade shadow-lg">
            <p className="text-xs text-secondary">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
