"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Download, Check } from "lucide-react"

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
      const [daysRes, logsRes, spendRes, foodRes, mediaRes, travelRes] = await Promise.all([
        supabase.from('days').select('*').eq('user_id', user.id),
        supabase.from('hour_logs').select('*').eq('user_id', user.id),
        supabase.from('spend_entries').select('*').eq('user_id', user.id),
        supabase.from('food_logs').select('*').eq('user_id', user.id),
        supabase.from('media_logs').select('*').eq('user_id', user.id),
        supabase.from('travel').select('*').eq('user_id', user.id),
      ])

      const data = {
        days: daysRes.data || [],
        hour_logs: logsRes.data || [],
        spend_entries: spendRes.data || [],
        food_logs: foodRes.data || [],
        media_logs: mediaRes.data || [],
        travel: travelRes.data || [],
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
        const csvRows = ['Date,Hour,Category ID,Note']
        logsRes.data?.forEach(log => {
          const day = daysRes.data?.find(d => d.id === log.day_id)
          csvRows.push(`${day?.date || ''},${log.hour},${log.category_id},"${log.note || ''}"`)
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
      <div className="max-w-lg mx-auto space-y-10">
        {/* Header */}
        <header className="pb-6 border-b border-white/[0.06]">
          <h1 className="text-2xl font-light tracking-tight text-primary">Settings</h1>
        </header>

        {/* Account */}
        <section className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted">Account</h2>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted">Email</span>
            <p className="text-sm text-secondary">{user?.email}</p>
          </div>
        </section>

        {/* Timezone */}
        <section className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted">Timezone</h2>
          <div className="space-y-3">
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g., Asia/Kolkata"
              className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {message === 'Saved' && (
                <span className="flex items-center gap-1 text-[11px] text-muted">
                  <Check className="w-3 h-3" /> {message}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted">
              All timestamps are stored in UTC. Changing timezone only affects display.
            </p>
          </div>
        </section>

        {/* Export */}
        <section className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted">Export Data</h2>
          <p className="text-xs text-muted">
            Download all your Lifegrid data. You own your data completely.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleExportData('json')}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors"
            >
              <Download className="w-3 h-3" />
              CSV (Hours)
            </button>
          </div>
        </section>

        {/* Message toast */}
        {message && message !== 'Saved' && (
          <div className="fixed bottom-6 right-6 px-4 py-2 bg-[#0A0A0A] border border-white/[0.06] rounded-sm animate-fade">
            <p className="text-xs text-secondary">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
