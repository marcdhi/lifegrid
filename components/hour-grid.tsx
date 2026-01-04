"use client"

import { useState, useRef, useCallback } from "react"
import type { Category, HourCellData } from "@/lib/types"
import { formatHour } from "@/lib/utils"

interface HourGridProps {
  hours: HourCellData[]
  categories: Category[]
  onHourUpdate: (hour: number, categoryId: string) => void
  onHourClear: (hour: number) => void
}

// Dusty, desaturated category colors (Apple-like)
const categoryColorMap: Record<string, string> = {
  'Sleep': '#1E1F2E',
  'Work': '#5C2A2A',
  'Hobbies / Projects': '#8B5A2B',
  'Freelance': '#5E4A6B',
  'Exercise': '#2B4A42',
  'Friends': '#3A5A6B',
  'Relaxation & Leisure': '#3D444A',
  'Dating / Partner': '#6B4A52',
  'Family': '#5A4A3A',
  'Productive / Chores': '#4A5030',
  'Travel': '#2E3D4A',
  'Misc / Getting Ready': '#2A2A2A',
}

function getCategoryColor(category?: Category): string {
  if (!category) return 'transparent'
  return categoryColorMap[category.name] || category.color
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
        <div className="mb-4 flex items-center gap-3 py-2.5 px-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
          <div
            className="w-3 h-3 rounded-md"
            style={{
              backgroundColor: getCategoryColor(categories.find(c => c.id === selectedCategory))
            }}
          />
          <span className="text-xs text-secondary tracking-wide">
            {categories.find(c => c.id === selectedCategory)?.name || 'Unknown'}
          </span>
          <button
            onClick={() => setSelectedCategory(null)}
            className="ml-auto text-xs text-muted hover:text-secondary tracking-wide transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Hour grid - 8 columns, compact, pixel-like */}
      <div
        ref={gridRef}
        className="grid grid-cols-8 gap-1 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {hours.map((hourData) => {
          const category = hourData.category
          const bgColor = getCategoryColor(category)
          
          return (
            <div
              key={hourData.hour}
              className="hour-cell relative aspect-[1.2] cursor-pointer group rounded-xl overflow-hidden"
              style={{
                backgroundColor: category ? bgColor : '#1A120B',
              }}
              onMouseDown={(e) => handleMouseDown(hourData.hour, e)}
              onMouseEnter={() => handleMouseEnter(hourData.hour)}
              onMouseUp={handleMouseUp}
              title={`${formatHour(hourData.hour)}${category ? ` - ${category.name}` : ''}`}
            >
              {/* Hour label - top left, tiny, muted */}
              <span
                className={`absolute top-1.5 left-2 text-[9px] font-mono transition-opacity ${
                  category 
                    ? 'text-white/40 group-hover:text-white/60' 
                    : 'text-muted group-hover:text-secondary'
                }`}
              >
                {formatHour(hourData.hour)}
              </span>
              
              {/* Hover state - subtle brightness */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
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
            className="fixed z-50 bg-popover border border-white/[0.06] rounded-xl p-1.5 w-56 max-h-80 overflow-y-auto animate-fade shadow-lg"
            style={{
              left: `${Math.min(pickerPosition.x, window.innerWidth - 240)}px`,
              top: `${Math.min(pickerPosition.y, window.innerHeight - 340)}px`,
            }}
          >
            <div className="space-y-0.5">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div
                    className="w-3 h-3 rounded-md flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                  <span className="text-xs text-secondary group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Category palette - horizontal, compact */}
      <div className="mt-6 pt-4 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left ${
                selectedCategory === category.id
                  ? 'bg-white/[0.08] ring-1 ring-white/10'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-md flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(category) }}
              />
              <span className={`text-xs ${
                selectedCategory === category.id ? 'text-primary' : 'text-secondary'
              }`}>
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
