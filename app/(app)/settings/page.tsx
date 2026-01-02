"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
      setMessage('Failed to save settings')
    } else {
      setMessage('Settings saved')
      setUser({ ...user, timezone })
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

      setMessage(`Data exported as ${format.toUpperCase()}`)
    } catch (err) {
      setMessage('Export failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

        {/* Account info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Account</h2>
          <div className="p-4 bg-card border border-border rounded-md">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Timezone</h2>
          <div className="space-y-3">
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g., America/New_York"
            />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Timezone'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Changing your timezone will not affect existing data. All timestamps are stored in UTC.
            </p>
          </div>
        </div>

        {/* Export data */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Export Data</h2>
          <p className="text-sm text-muted-foreground">
            Download all your Lifegrid data. You own your data completely.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => handleExportData('json')} variant="outline">
              Export as JSON
            </Button>
            <Button onClick={() => handleExportData('csv')} variant="outline">
              Export Hours as CSV
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="p-4 bg-accent rounded-md">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

