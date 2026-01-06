"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Clock } from "lucide-react"
import type { Category, HourLog } from "@/lib/types"
import { formatHour } from "@/lib/utils"

interface HourGridMobileProps {
  hours: HourLog[]
  categories: Category[]
  onBlockUpdate: (id: string, updates: Partial<HourLog>) => void
  onBlockCreate: (hour: number, categoryId: string, durationMinutes: number, startOffset?: number) => void
  onBlockDelete: (id: string) => void
}

function getCategoryColor(category?: Category): string {
  if (!category) return 'var(--overlay-light)'
  return category.color
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  if (minutes === 0) return `${displayHour}${period}`
  return `${displayHour}:${minutes.toString().padStart(2, '0')}${period}`
}

export function HourGridMobile({ 
  hours, 
  categories, 
  onBlockUpdate, 
  onBlockCreate, 
  onBlockDelete 
}: HourGridMobileProps) {
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTaskTime, setNewTaskTime] = useState({ hour: 9, offset: 0, duration: 60 })

  // Sort blocks by start time
  const sortedBlocks = hours
    .map(block => {
      const category = categories.find(c => c.id === block.category_id)
      return {
        ...block,
        category: category || undefined,
        startMinutes: block.hour * 60 + (block.start_offset || 0),
        endMinutes: block.hour * 60 + (block.start_offset || 0) + block.duration_minutes
      }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes)

  const handleEdit = (block: HourLog) => {
    setEditingBlock(block.id)
  }

  const handleSaveEdit = (blockId: string, updates: Partial<HourLog>) => {
    onBlockUpdate(blockId, updates)
    setEditingBlock(null)
  }

  const handleAddTask = () => {
    if (!selectedCategory) {
      setShowAddModal(true)
      return
    }
    
    const startMinutes = newTaskTime.hour * 60 + newTaskTime.offset
    
    // Find gaps and place task
    const sorted = sortedBlocks.sort((a, b) => a.startMinutes - b.startMinutes)
    let gapStart = startMinutes
    
    // Check for overlaps - find next available slot
    for (const block of sorted) {
      if (block.startMinutes <= gapStart && block.endMinutes > gapStart) {
        gapStart = block.endMinutes
      }
    }
    
    // Find next block
    const nextBlock = sorted.find(b => b.startMinutes > gapStart)
    const gapEnd = nextBlock ? nextBlock.startMinutes : 24 * 60 // End of day
    
    const finalDuration = Math.min(newTaskTime.duration, gapEnd - gapStart)
    const finalHour = Math.floor(gapStart / 60)
    const finalOffset = gapStart % 60
    
    if (finalDuration >= 5 && finalHour < 24) {
      onBlockCreate(finalHour, selectedCategory, finalDuration, finalOffset)
      setShowAddModal(false)
      setSelectedCategory(null)
      setNewTaskTime({ hour: 9, offset: 0, duration: 60 })
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      <button
        onClick={() => {
          // Set default time to now or end of last task
          const now = new Date()
          const lastBlock = sortedBlocks[sortedBlocks.length - 1]
          const defaultStart = lastBlock 
            ? lastBlock.endMinutes 
            : now.getHours() * 60 + Math.round(now.getMinutes() / 15) * 15
          
          setNewTaskTime({
            hour: Math.floor(defaultStart / 60),
            offset: defaultStart % 60,
            duration: 60
          })
          setShowAddModal(true)
        }}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Add Task</span>
      </button>

      {/* Blocks List */}
      <div className="space-y-2">
        {sortedBlocks.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">
            No tasks logged yet
          </div>
        ) : (
          sortedBlocks.map(block => {
            const isEditing = editingBlock === block.id
            
            return (
              <div
                key={block.id}
                className="p-3 rounded-lg border border-white/10 bg-white/5"
                style={{
                  borderLeftColor: block.category?.color || 'transparent',
                  borderLeftWidth: '4px'
                }}
              >
                {isEditing ? (
                  <EditBlockForm
                    block={block}
                    categories={categories}
                    onSave={(updates) => handleSaveEdit(block.id, updates)}
                    onCancel={() => setEditingBlock(null)}
                    onDelete={() => {
                      onBlockDelete(block.id)
                      setEditingBlock(null)
                    }}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: getCategoryColor(block.category) }}
                          />
                          <span className="font-semibold text-primary">
                            {block.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTime(block.startMinutes)} - {formatTime(block.endMinutes)}
                          </span>
                          <span className="text-muted/60">
                            ({block.duration_minutes}min)
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(block)}
                        className="p-1.5 text-muted hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onAdd={handleAddTask}
          onClose={() => {
            setShowAddModal(false)
            setSelectedCategory(null)
          }}
          time={newTaskTime}
          onTimeChange={setNewTaskTime}
        />
      )}
    </div>
  )
}

function EditBlockForm({
  block,
  categories,
  onSave,
  onCancel,
  onDelete
}: {
  block: HourLog & { startMinutes: number; endMinutes: number }
  categories: Category[]
  onSave: (updates: Partial<HourLog>) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [categoryId, setCategoryId] = useState(block.category_id)
  const [startHour, setStartHour] = useState(Math.floor(block.startMinutes / 60))
  const [startOffset, setStartOffset] = useState(block.start_offset || 0)
  const [duration, setDuration] = useState(block.duration_minutes)

  const handleSave = () => {
    onSave({
      category_id: categoryId,
      hour: startHour,
      start_offset: startOffset,
      duration_minutes: duration
    })
  }

  return (
    <div className="space-y-3">
      {/* Category Select */}
      <div>
        <label className="text-xs text-muted mb-1.5 block">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Time Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted mb-1.5 block">Start</label>
          <div className="flex gap-1">
            <input
              type="number"
              min="0"
              max="23"
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-primary"
            />
            <input
              type="number"
              min="0"
              max="59"
              step="5"
              value={startOffset}
              onChange={(e) => setStartOffset(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-primary"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted mb-1.5 block">Duration (min)</label>
          <input
            type="number"
            min="5"
            step="5"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onDelete}
          className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-base font-medium"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-white/5 text-secondary border border-white/10 rounded-lg text-base font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-base font-medium"
        >
          Save
        </button>
      </div>
    </div>
  )
}

function AddTaskModal({
  categories,
  selectedCategory,
  onCategorySelect,
  onAdd,
  onClose,
  time,
  onTimeChange
}: {
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (id: string) => void
  onAdd: () => void
  onClose: () => void
  time: { hour: number; offset: number; duration: number }
  onTimeChange: (time: { hour: number; offset: number; duration: number }) => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div className="w-full bg-card rounded-t-2xl border-t border-white/10 p-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">Add Task</h3>
            <button onClick={onClose} className="text-muted hover:text-primary">
              ✕
            </button>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-xs text-muted mb-2 block">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onCategorySelect(cat.id)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedCategory === cat.id
                      ? 'bg-white/10 border-primary'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-primary">{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1.5 block">Start Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={time.hour}
                onChange={(e) => onTimeChange({ ...time, hour: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Start Minute</label>
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={time.offset}
                onChange={(e) => onTimeChange({ ...time, offset: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted mb-1.5 block">Duration (minutes)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={time.duration}
                onChange={(e) => onTimeChange({ ...time, duration: parseInt(e.target.value) || 5 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary"
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={onAdd}
            disabled={!selectedCategory}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}

