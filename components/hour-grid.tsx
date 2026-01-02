"use client"

import { useState, useRef, useCallback } from "react"
import type { Category, HourCellData } from "@/lib/types"
import { formatHour } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface HourGridProps {
  hours: HourCellData[]
  categories: Category[]
  onHourUpdate: (hour: number, categoryId: string) => void
  onHourClear: (hour: number) => void
}

export function HourGrid({ hours, categories, onHourUpdate, onHourClear }: HourGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState<{ x: number; y: number } | null>(null)
  const [activeHour, setActiveHour] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((hour: number, e: React.MouseEvent) => {
    e.preventDefault()
    
    const hourData = hours.find(h => h.hour === hour)
    
    // Right click or cmd+click to clear
    if (e.button === 2 || e.metaKey) {
      if (hourData?.category) {
        onHourClear(hour)
      }
      return
    }
    
    // Left click
    if (!selectedCategory) {
      // No category selected - show picker
      setActiveHour(hour)
      setPickerPosition({ x: e.clientX, y: e.clientY })
      setShowCategoryPicker(true)
    } else {
      // Category selected - start painting
      setIsDragging(true)
      onHourUpdate(hour, selectedCategory)
    }
  }, [hours, selectedCategory, onHourUpdate, onHourClear])

  const handleMouseEnter = useCallback((hour: number) => {
    if (isDragging && selectedCategory) {
      onHourUpdate(hour, selectedCategory)
    }
  }, [isDragging, selectedCategory, onHourUpdate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCategorySelect = useCallback((categoryId: string) => {
    if (activeHour !== null) {
      onHourUpdate(activeHour, categoryId)
    }
    setShowCategoryPicker(false)
    setActiveHour(null)
  }, [activeHour, onHourUpdate])

  // Global mouse up listener
  useState(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  })

  return (
    <div className="relative">
      {/* Active category indicator */}
      {selectedCategory && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-card rounded-md border border-border">
          <div
            className="w-6 h-6 rounded"
            style={{
              backgroundColor: categories.find(c => c.id === selectedCategory)?.color || '#4B4B4B'
            }}
          />
          <span className="text-sm font-medium">
            {categories.find(c => c.id === selectedCategory)?.name || 'Unknown'}
          </span>
          <button
            onClick={() => setSelectedCategory(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Hour grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-6 gap-2 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {hours.map((hourData) => {
          const category = hourData.category
          
          return (
            <div
              key={hourData.hour}
              className={cn(
                "hour-cell relative aspect-square rounded-md cursor-pointer transition-all",
                category ? "hour-cell-filled" : "hour-cell-empty"
              )}
              style={{
                backgroundColor: category?.color || 'transparent',
                borderWidth: category ? '0' : '1px',
              }}
              onMouseDown={(e) => handleMouseDown(hourData.hour, e)}
              onMouseEnter={() => handleMouseEnter(hourData.hour)}
              onMouseUp={handleMouseUp}
              title={`${formatHour(hourData.hour)}${category ? ` - ${category.name}` : ''}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "text-xs font-medium",
                    category ? "text-white mix-blend-difference" : "text-muted-foreground"
                  )}
                >
                  {formatHour(hourData.hour)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Category picker popover */}
      {showCategoryPicker && pickerPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowCategoryPicker(false)
              setActiveHour(null)
            }}
          />
          <div
            className="fixed z-50 bg-popover border border-border rounded-md shadow-lg p-2 w-64 max-h-96 overflow-y-auto"
            style={{
              left: `${pickerPosition.x}px`,
              top: `${pickerPosition.y}px`,
            }}
          >
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors text-left"
                >
                  <div
                    className="w-5 h-5 rounded flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Category palette */}
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border transition-colors text-left",
                selectedCategory === category.id
                  ? "border-foreground/40 bg-accent"
                  : "border-border hover:border-foreground/20 hover:bg-accent/50"
              )}
            >
              <div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

