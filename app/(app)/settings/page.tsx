"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Category, UserPrivacySettings } from "@/lib/types"
import { Download, Check, Plus, Edit2, X, Tag, Shield } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { TextField } from "@/components/ui/text-field"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn, filterCategoriesForUser } from "@/lib/utils"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null)
  const [savingPrivacy, setSavingPrivacy] = useState<string | null>(null)
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#4ECDC4')
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#4ECDC4')

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

  // Fetch or create privacy settings
  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setPrivacySettings(data)
      } else if (error?.code === 'PGRST116') {
        // PGRST116: No rows returned - user has no privacy settings yet
        // Create default privacy settings (all private)
        const { data: newSettings, error: insertError } = await supabase
          .from('user_privacy_settings')
          .insert({
            user_id: user.id,
            fitness_public: false,
            analytics_public: false,
            schedule_public: false,
            grid_public: false,
          })
          .select()
          .single()

        if (!insertError && newSettings) {
          setPrivacySettings(newSettings)
        }
      }
    }

    fetchPrivacySettings()
  }, [supabase, user])

  // Fetch categories - filter out system categories if user has custom ones with same name
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!error && data) {
        // Filter out system categories if user has custom ones with same name
        const filtered = filterCategoriesForUser(data, user?.id || null)
        setCategories(filtered)
      }
    }
    fetchCategories()
  }, [supabase, user])

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

  const handlePrivacyToggle = async (field: 'fitness_public' | 'analytics_public' | 'schedule_public' | 'grid_public') => {
    if (!user || !privacySettings) return

    setSavingPrivacy(field)

    const newValue = !privacySettings[field]
    
    const { error } = await supabase
      .from('user_privacy_settings')
      .update({ [field]: newValue })
      .eq('user_id', user.id)

    if (!error) {
      setPrivacySettings({ ...privacySettings, [field]: newValue })
      setMessage('Privacy settings updated')
      setTimeout(() => setMessage(null), 2000)
    } else {
      setMessage(`Failed to update privacy settings: ${error?.message || 'Unknown error'}`)
      setTimeout(() => setMessage(null), 3000)
    }

    setSavingPrivacy(null)
  }

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editName.trim() || !user) return
    
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    // If it's a system category (user_id is null), create a user-specific copy
    if (!category.user_id) {
      // Check if user already has a custom category with this name (case-insensitive)
      const existingCustom = categories.find(
        c => c.user_id === user.id && c.name.toLowerCase() === editName.trim().toLowerCase()
      )
      
      if (existingCustom) {
        // Update existing custom category instead
        const { error } = await supabase
          .from('categories')
          .update({ color: editColor })
          .eq('id', existingCustom.id)
          .eq('user_id', user.id)

        if (!error) {
          setCategories(prev => prev.map(c => 
            c.id === existingCustom.id ? { ...c, color: editColor } : c
          ))
          setEditingCategory(null)
          setMessage('Category updated')
          setTimeout(() => setMessage(null), 2000)
        } else {
          console.error('Error updating category:', error)
          setMessage(`Failed to update category: ${error?.message || 'Unknown error'}`)
          setTimeout(() => setMessage(null), 3000)
        }
      } else {
        // Create new user-specific copy of the system category
        const maxSort = categories.reduce((max, c) => Math.max(max, c.sort_order), 0)
        
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: editName.trim(),
            color: editColor,
            sort_order: maxSort + 1
          })
          .select()
          .single()

        if (!createError && newCategory) {
          // Migrate all existing hour_logs and tasks from system category to new custom category
          const oldSystemCategoryId = categoryId
          const newCustomCategoryId = newCategory.id

          // Update hour_logs
          const { error: logsError } = await supabase
            .from('hour_logs')
            .update({ category_id: newCustomCategoryId })
            .eq('category_id', oldSystemCategoryId)
            .eq('user_id', user.id)

          // Update tasks
          const { error: tasksError } = await supabase
            .from('tasks')
            .update({ category_id: newCustomCategoryId })
            .eq('category_id', oldSystemCategoryId)
            .eq('user_id', user.id)

          if (logsError || tasksError) {
            console.error('Error migrating data:', logsError || tasksError)
            setMessage('Category created but some data migration failed')
            setTimeout(() => setMessage(null), 3000)
          } else {
            setCategories(prev => [...prev, newCategory])
            setEditingCategory(null)
            setMessage('Custom category created and data migrated')
            setTimeout(() => setMessage(null), 2000)
          }
        } else {
          console.error('Error creating category:', createError)
          setMessage(`Failed to create category: ${createError?.message || 'Unknown error'}`)
          setTimeout(() => setMessage(null), 3000)
        }
      }
    } else {
      // Update user's own category
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim(), color: editColor })
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (!error) {
        setCategories(prev => prev.map(c => 
          c.id === categoryId ? { ...c, name: editName.trim(), color: editColor } : c
        ))
        setEditingCategory(null)
        setMessage('Category updated')
        setTimeout(() => setMessage(null), 2000)
      } else {
        console.error('Error updating category:', error)
        setMessage(`Failed to update category: ${error?.message || 'Unknown error'}`)
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user) return
    
    // Get max sort order
    const maxSort = categories.reduce((max, c) => Math.max(max, c.sort_order), 0)
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: newCategoryName.trim(),
        color: newCategoryColor,
        sort_order: maxSort + 1
      })
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => [...prev, data])
      setShowCreateCategory(false)
      setNewCategoryName('')
      setNewCategoryColor('#4ECDC4')
      setMessage('Category created')
      setTimeout(() => setMessage(null), 2000)
    } else {
      setMessage('Failed to create category')
      setTimeout(() => setMessage(null), 2000)
    }
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.id)
    setEditName(category.name)
    setEditColor(category.color)
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setEditName('')
    setEditColor('#4ECDC4')
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
              <span className="text-sm tracking-wide text-muted font-medium">Email</span>
              <p className="text-sm text-secondary">{user?.email}</p>
            </div>
          </Card>
        </section>

        {/* Privacy Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted" />
            <SectionHeader>Privacy Settings</SectionHeader>
          </div>
          <Card>
            <div className="space-y-6">
              <p className="text-sm text-muted">
                Control what data you share with accepted friends. All settings default to private.
              </p>

              {/* Fitness Data Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label htmlFor="fitness-toggle" className="text-sm font-medium text-secondary cursor-pointer">
                    Fitness Data
                  </label>
                  <p className="text-sm text-muted">
                    Share your workout plans, completions, and food logs with friends
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {savingPrivacy === 'fitness_public' && (
                    <span className="text-xs text-muted">Saving...</span>
                  )}
                  <Switch
                    id="fitness-toggle"
                    checked={privacySettings?.fitness_public || false}
                    onCheckedChange={() => handlePrivacyToggle('fitness_public')}
                    disabled={savingPrivacy === 'fitness_public'}
                  />
                </div>
              </div>

              {/* Analytics Data Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label htmlFor="analytics-toggle" className="text-sm font-medium text-secondary cursor-pointer">
                    Analytics Data
                  </label>
                  <p className="text-sm text-muted">
                    Share your activity analytics and statistics with friends
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {savingPrivacy === 'analytics_public' && (
                    <span className="text-xs text-muted">Saving...</span>
                  )}
                  <Switch
                    id="analytics-toggle"
                    checked={privacySettings?.analytics_public || false}
                    onCheckedChange={() => handlePrivacyToggle('analytics_public')}
                    disabled={savingPrivacy === 'analytics_public'}
                  />
                </div>
              </div>

              {/* Schedule Data Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label htmlFor="schedule-toggle" className="text-sm font-medium text-secondary cursor-pointer">
                    Schedule Data
                  </label>
                  <p className="text-sm text-muted">
                    Share your daily schedule and planned activities with friends
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {savingPrivacy === 'schedule_public' && (
                    <span className="text-xs text-muted">Saving...</span>
                  )}
                  <Switch
                    id="schedule-toggle"
                    checked={privacySettings?.schedule_public || false}
                    onCheckedChange={() => handlePrivacyToggle('schedule_public')}
                    disabled={savingPrivacy === 'schedule_public'}
                  />
                </div>
              </div>

              {/* Grid Data Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label htmlFor="grid-toggle" className="text-sm font-medium text-secondary cursor-pointer">
                    Grid View
                  </label>
                  <p className="text-sm text-muted">
                    Share your hour-by-hour activity grid and time logs with friends
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {savingPrivacy === 'grid_public' && (
                    <span className="text-xs text-muted">Saving...</span>
                  )}
                  <Switch
                    id="grid-toggle"
                    checked={privacySettings?.grid_public || false}
                    onCheckedChange={() => handlePrivacyToggle('grid_public')}
                    disabled={savingPrivacy === 'grid_public'}
                  />
                </div>
              </div>
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
                  className="px-4 py-2 text-sm tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save timezone'}
                </button>
                {message === 'Saved' && (
                  <span className="flex items-center gap-1.5 text-sm text-secondary">
                    <Check className="w-3.5 h-3.5" /> {message}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted">
                All timestamps are stored in UTC. Changing timezone only affects display.
              </p>
            </div>
          </Card>
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader>Categories</SectionHeader>
            {!showCreateCategory && (
              <button
                onClick={() => setShowCreateCategory(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            )}
          </div>
          
          <Card>
            <div className="space-y-3">
              {/* Create Category Form */}
              {showCreateCategory && (
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary">New Category</span>
                    <button
                      onClick={() => {
                        setShowCreateCategory(false)
                        setNewCategoryName('')
                        setNewCategoryColor('#4ECDC4')
                      }}
                      className="p-1 text-muted hover:text-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <TextField
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      autoFocus
                    />
                    
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted whitespace-nowrap">Color:</label>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewCategoryColor(c)}
                            className={cn(
                              "w-6 h-6 rounded-full transition-transform hover:scale-110",
                              newCategoryColor === c && "ring-2 ring-white ring-offset-1 ring-offset-black"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input 
                          type="color" 
                          value={newCategoryColor} 
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                          title="Custom color"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="w-full px-4 py-2 text-sm tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Category
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
                  >
                    {editingCategory === category.id ? (
                      <>
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: editColor }}
                        />
                        <div className="flex-1 space-y-2">
                          <TextField
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-muted whitespace-nowrap">Color:</label>
                            <div className="flex flex-wrap gap-1.5 flex-1">
                              {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setEditColor(c)}
                                  className={cn(
                                    "w-5 h-5 rounded-full transition-transform hover:scale-110",
                                    editColor === c && "ring-2 ring-white ring-offset-1 ring-offset-black"
                                  )}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                              <input 
                                type="color" 
                                value={editColor} 
                                onChange={(e) => setEditColor(e.target.value)}
                                className="w-5 h-5 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                                title="Custom color"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateCategory(category.id)}
                            disabled={!editName.trim()}
                            className="p-1.5 text-primary hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-secondary truncate">{category.name}</p>
                          {category.user_id && (
                            <p className="text-sm text-muted/50 mt-0.5">Custom</p>
                          )}
                        </div>
                        <button
                          onClick={() => startEditCategory(category)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                
                {categories.length === 0 && (
                  <div className="text-center py-8 text-muted text-sm">
                    No categories yet
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Export */}
        <section className="space-y-4">
          <SectionHeader>Export data</SectionHeader>
          <Card>
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Download all your Lifegrid data. You own your data completely.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportData('json')}
                  className="flex items-center gap-2 px-4 py-2 text-sm tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </button>
                <button
                  onClick={() => handleExportData('csv')}
                  className="flex items-center gap-2 px-4 py-2 text-sm tracking-wide text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
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
          <p className="text-sm text-muted italic text-center">
            Your data lives with you. Export it anytime, delete your account whenever you want.
          </p>
        </div>

        {/* Message toast */}
        {message && message !== 'Saved' && (
          <div className="fixed bottom-6 right-6 px-4 py-3 bg-popover border border-white/[0.06] rounded-xl animate-fade shadow-lg">
            <p className="text-sm text-secondary">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
