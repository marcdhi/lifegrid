"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, X, Clock, Trash2, Tag, Calendar, Check, Repeat } from "lucide-react"
import type { Task, Category, HourLog } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { cn, formatHour } from "@/lib/utils"
import { TimelinePicker } from "@/components/timeline-picker"

interface TaskListProps {
  tasks: Task[]
  categories: Category[]
  hourLogs: HourLog[]
  onTaskCreate: (title: string, categoryId: string, isRecurring: boolean) => void
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
  onTaskComplete: (taskId: string, hour: number, durationMinutes: number, startOffset: number, notes?: string, keepActive?: boolean) => void
  onCategoryCreate?: (name: string, color: string) => Promise<Category | null>
}

// Helper to get category color - uses only database color
function getCategoryColor(category?: Category): string {
  if (!category) return 'var(--overlay-light)'
  return category.color // Use color directly from database
}

export function TaskList({ 
  tasks, 
  categories, 
  hourLogs,
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete,
  onTaskComplete,
  onCategoryCreate
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [customColor, setCustomColor] = useState("#4ECDC4")
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<string | null>(null)
  
  // Modal state
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [notes, setNotes] = useState("")
  const [keepActive, setKeepActive] = useState(false)

  const categoryPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target as Node)) {
        setShowCategoryPicker(false)
        setCategorySearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !selectedCategory) return
    onTaskCreate(newTaskTitle, selectedCategory, isRecurring)
    setNewTaskTitle("")
    setIsRecurring(false)
    // Keep category selected for rapid entry
  }

  const handleCreateCategory = async (name: string) => {
    if (!onCategoryCreate) return
    
    const newCategory = await onCategoryCreate(name, customColor)
    if (newCategory) {
      setSelectedCategory(newCategory.id)
      setShowCategoryPicker(false)
      setCategorySearch("")
      // Reset custom color for next time (maybe to random or keep it?)
      // Let's keep it to allow consecutive creations with same color or let user change it.
    }
  }

  const handleDeleteTask = () => {
    if (deletingTask) {
       onTaskDelete(deletingTask)
       setDeletingTask(null)
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const handleCheckboxChange = (task: Task, checked: boolean) => {
    if (checked) {
      // Open completion modal
      setCompletingTask(task)
      
      // Smart default: Find the last logged activity end time
      const sortedLogs = [...hourLogs].sort((a, b) => {
        const aEnd = a.hour * 60 + (a.start_offset || 0) + a.duration_minutes
        const bEnd = b.hour * 60 + (b.start_offset || 0) + b.duration_minutes
        return bEnd - aEnd
      })
      
      let startMinutes = 0
      if (sortedLogs.length > 0) {
        const lastLog = sortedLogs[0]
        startMinutes = lastLog.hour * 60 + (lastLog.start_offset || 0) + lastLog.duration_minutes
      } else {
        // No logs yet, use current time rounded to nearest 15m
        const now = new Date()
        startMinutes = now.getHours() * 60 + Math.round(now.getMinutes() / 15) * 15
      }
      
      // Cap at end of day
      if (startMinutes >= 1440) startMinutes = 1380 // 23:00
      
      const startHours = Math.floor(startMinutes / 60)
      const startMins = startMinutes % 60
      const start = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`
      setStartTime(start)
      
      // Set end time to 1 hour later (or end of day)
      const endMinutes = Math.min(startMinutes + 60, 1440)
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      setEndTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`)
      
      setNotes(task.notes || "")
      setKeepActive(false) // Reset checkbox when opening modal
    } else {
      // Mark incomplete - generic update
      onTaskUpdate(task.id, { completed: false })
    }
  }

  const confirmCompletion = () => {
    if (!completingTask) return
    
    // Parse start and end times
    const [startHoursStr, startMinsStr] = startTime.split(':')
    const [endHoursStr, endMinsStr] = endTime.split(':')
    
    const startHour = parseInt(startHoursStr)
    const startMinutes = parseInt(startMinsStr)
    const endHour = parseInt(endHoursStr)
    const endMinutes = parseInt(endMinsStr)
    
    // Calculate duration in minutes
    const startTotalMinutes = startHour * 60 + startMinutes
    const endTotalMinutes = endHour * 60 + endMinutes
    
    // Handle case where end time is next day (e.g., 23:00 to 01:00)
    let durationMinutes = endTotalMinutes - startTotalMinutes
    if (durationMinutes < 0) {
      durationMinutes = (24 * 60) - startTotalMinutes + endTotalMinutes
    }
    
    // Ensure minimum duration of 5 minutes
    if (durationMinutes < 5) {
      durationMinutes = 5
    }
    
    // Check for overlaps - prevent submission if overlap exists
    const hasOverlap = hourLogs.some(log => {
      const logStart = log.hour * 60 + (log.start_offset || 0)
      const logEnd = logStart + log.duration_minutes
      return (
        (startTotalMinutes >= logStart && startTotalMinutes < logEnd) ||
        (endTotalMinutes > logStart && endTotalMinutes <= logEnd) ||
        (startTotalMinutes <= logStart && endTotalMinutes >= logEnd)
      )
    })
    
    if (hasOverlap) {
      // Don't allow submission - the timeline picker already shows the error
      return
    }
    
    onTaskComplete(completingTask.id, startHour, durationMinutes, startMinutes, notes, keepActive)
    setCompletingTask(null)
    setNotes("")
    setKeepActive(false)
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0
    return a.completed ? 1 : -1
  })

  return (
    <div className="space-y-6">
      {/* Create Task Input - Minimal Apple-like */}
      <form onSubmit={handleCreateTask} className="relative z-10 group">
        <div className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/10 rounded-2xl transition-all duration-300 shadow-sm">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors"
              title="Select Category"
            >
              {selectedCategory ? (
                <div 
                  className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-white/10"
                  style={{ backgroundColor: getCategoryColor(categories.find(c => c.id === selectedCategory)) }}
                />
              ) : (
                <Tag className="w-4 h-4 text-muted/70" />
              )}
            </button>

            {/* Category Picker Popover */}
            {showCategoryPicker && (
              <div 
                ref={categoryPickerRef}
                className="absolute top-full left-0 mt-2 w-64 bg-popover border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95"
              >
                <div className="p-2 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search or create..."
                    className="w-full bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-white/20 transition-colors placeholder:text-muted"
                  />
                </div>
                
                <div className="max-h-56 overflow-y-auto p-1">
                  {filteredCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setShowCategoryPicker(false)
                        setCategorySearch("")
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-sm text-left group"
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      <span className="truncate text-secondary group-hover:text-primary transition-colors">{category.name}</span>
                      {selectedCategory === category.id && (
                        <Check className="w-3.5 h-3.5 ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                  
                  {categorySearch && !filteredCategories.find(c => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                    <div className="p-2 space-y-2 bg-white/[0.02] rounded-lg mt-1 mx-1 border border-white/[0.04]">
                       <div className="flex items-center justify-between text-xs text-muted mb-1 px-1">
                         <span>Create "{categorySearch}"</span>
                       </div>
                       
                       <div className="flex flex-wrap gap-1.5 px-1">
                          {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCustomColor(c)}
                              className={cn(
                                "w-4 h-4 rounded-full transition-transform hover:scale-110",
                                customColor === c && "ring-2 ring-white ring-offset-1 ring-offset-black"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <input 
                             type="color" 
                             value={customColor} 
                             onChange={(e) => setCustomColor(e.target.value)}
                             className="w-4 h-4 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                             title="Custom color"
                          />
                       </div>

                       <button
                        type="button"
                        onClick={() => handleCreateCategory(categorySearch)}
                        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium text-primary transition-colors mt-2"
                      >
                        <Plus className="w-3 h-3" />
                        Create Category
                      </button>
                    </div>
                  )}
                  
                  {filteredCategories.length === 0 && !categorySearch && (
                     <div className="px-2 py-3 text-xs text-muted text-center italic">
                       Type to create a new category
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-muted/40 text-primary h-8 font-medium"
          />

          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all",
              isRecurring ? "text-primary" : "text-muted/50"
            )}
            title={isRecurring ? "Recurring task (daily)" : "Make recurring (daily)"}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!newTaskTitle.trim() || !selectedCategory}
            className="p-1.5 rounded-full bg-primary text-primary-foreground opacity-0 scale-90 group-focus-within:opacity-100 group-focus-within:scale-100 disabled:opacity-0 disabled:scale-90 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Task List - Clean & Minimal */}
      <div className="space-y-2">
        {sortedTasks.length === 0 && (
          <div className="text-center py-16 px-4">
             <div className="text-muted/30 text-sm font-light">No tasks yet</div>
          </div>
        )}
        
        {sortedTasks.map(task => {
          const category = categories.find(c => c.id === task.category_id)
          const categoryColor = getCategoryColor(category)
          
          return (
            <div 
              key={task.id}
              className={cn(
                "group flex items-center gap-3.5 p-3 rounded-xl transition-all duration-200",
                task.completed 
                  ? "opacity-40" 
                  : "hover:bg-white/[0.02]"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => handleCheckboxChange(task, checked as boolean)}
                className={cn(
                  "rounded-full w-5 h-5 transition-all duration-300",
                  task.completed 
                    ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                    : "border-muted-foreground/30 border-dashed hover:border-primary/50"
                )}
              />
              
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className={cn(
                  "text-[15px] truncate leading-tight transition-colors",
                  task.completed ? "text-muted line-through decoration-muted/50" : "text-primary/90 font-medium"
                )}>
                  {task.title}
                </span>

                {task.is_recurring && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold tracking-wide border border-blue-500/20">
                    <Repeat className="w-2.5 h-2.5" />
                    Daily
                  </span>
                )}

                {category && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide text-white/90 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {category.name}
                    </span>
                )}
                
                {task.notes && (
                  <span className="hidden sm:inline-block text-[11px] text-muted/50 truncate max-w-[200px]">
                    {task.notes}
                  </span>
                )}
              </div>

              {/* Only allow toggling recurring status on templates, not instances */}
              {!task.template_task_id && (
                <button
                  onClick={() => onTaskUpdate(task.id, { is_recurring: !task.is_recurring })}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 p-1.5 transition-all scale-90 hover:scale-100",
                    task.is_recurring ? "text-blue-400 hover:text-blue-300" : "text-muted/30 hover:text-blue-400"
                  )}
                  title={task.is_recurring ? "Remove daily recurrence" : "Make task recur daily"}
                >
                  <Repeat className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setDeletingTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted/30 hover:text-red-400 transition-all scale-90 hover:scale-100"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">Complete Task</h3>
                <p className="text-sm text-muted">{completingTask.title}</p>
              </div>
              <button 
                onClick={() => setCompletingTask(null)}
                className="p-1 text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {/* Timeline Picker */}
              <TimelinePicker
                existingLogs={hourLogs}
                categories={categories}
                startTime={startTime}
                endTime={endTime}
                onTimeChange={(start, end) => {
                  setStartTime(start)
                  setEndTime(end)
                }}
                selectedCategory={categories.find(c => c.id === completingTask?.category_id)}
              />

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it go?"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-white/20 min-h-[80px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 pb-2">
                <Checkbox
                  id="keep-active"
                  checked={keepActive}
                  onCheckedChange={(checked) => setKeepActive(checked as boolean)}
                  className={cn(
                    "rounded w-4 h-4 border-white/20 bg-white/5",
                    keepActive 
                      ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      : "border-dashed hover:border-white/40"
                  )}
                />
                <label 
                  htmlFor="keep-active"
                  className="text-sm text-secondary cursor-pointer select-none"
                >
                  Keep task active for repeat logging
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setCompletingTask(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCompletion}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Complete & Log Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary mb-1">Delete Task?</h3>
                <p className="text-sm text-muted">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTask(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

