"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import type { Category, HourLog } from "@/lib/types"
import { formatHour } from "@/lib/utils"

// Hook to detect mobile screen
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

interface HourGridProps {
  hours: HourLog[]
  categories: Category[]
  onBlockUpdate: (id: string, updates: Partial<HourLog>) => void
  onBlockCreate: (hour: number, categoryId: string, durationMinutes: number, startOffset?: number) => void
  onBlockDelete: (id: string) => void
}

// EXACT original category colors
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
  if (!category) return 'var(--overlay-light)' // Light default color from CSS variables
  return categoryColorMap[category.name] || category.color
}

// Convert hour to grid position (row, col)
function hourToGrid(hour: number, columns: number = 8): { row: number; col: number } {
  return {
    row: Math.floor(hour / columns),
    col: hour % columns
  }
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  if (minutes === 0) return `${displayHour}${period}`
  return `${displayHour}:${minutes.toString().padStart(2, '0')}${period}`
}

export function HourGrid({ hours, categories, onBlockUpdate, onBlockCreate, onBlockDelete }: HourGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState<{ x: number; y: number; hour?: number; startOffset?: number; blockId?: string } | null>(null)
  const [resizingBlock, setResizingBlock] = useState<{ id: string; edge: 'right' } | null>(null)
  const [dragStartData, setDragStartData] = useState<{ 
    mouseX: number; 
    originalDuration: number;
    hasMoved: boolean;
  } | null>(null)
  
  const gridRef = useRef<HTMLDivElement>(null)
  const blockClickRef = useRef<{ blockId: string; startX: number; startY: number } | null>(null)
  const isMobile = useIsMobile()
  const columns = isMobile ? 4 : 8

  // Normalize data BEFORE render - include blocks even without category
  const normalizedBlocks = useMemo(() => {
    return hours
      .map(block => {
        const category = categories.find(c => c.id === block.category_id)
        return {
          ...block,
          category: category || undefined
        }
      })
  }, [hours, categories])

  // Split blocks into visual segments (handling row wrapping)
  const visualSegments = useMemo(() => {
    return normalizedBlocks.flatMap(block => {
      const segments = []
      let remainingDuration = block.duration_minutes
      let currentHour = block.hour
      let currentOffset = block.start_offset || 0

      while (remainingDuration > 0) {
        const { row, col } = hourToGrid(currentHour, columns)
        
        // Calculate minutes available in the REST of the row from this start position
        const minutesInCurrentCell = 60 - currentOffset
        const minutesInRestOfRow = (columns - 1 - col) * 60
        const maxDurationInRow = minutesInCurrentCell + minutesInRestOfRow
        
        const segmentDuration = Math.min(remainingDuration, maxDurationInRow)
        
        segments.push({
          ...block,
          segmentKey: `${block.id}-${currentHour}-${currentOffset}`,
          row,
          col,
          startOffset: currentOffset,
          duration: segmentDuration,
          isFirst: currentHour === block.hour && currentOffset === (block.start_offset || 0),
          isLast: segmentDuration === remainingDuration
        })
        
        remainingDuration -= segmentDuration
        
        // Next segment starts at the beginning of the next valid hour
        const globalStart = block.hour * 60 + (block.start_offset || 0)
        const processed = block.duration_minutes - remainingDuration
        const globalCurrent = globalStart + processed
        currentHour = Math.floor(globalCurrent / 60)
        currentOffset = 0 // Wrapped segments always start at 0 offset
      }
      return segments
    })
  }, [normalizedBlocks, columns])

  const handleCellClick = (hour: number, e: React.MouseEvent) => {
    if (resizingBlock) return

    // Calculate global minute range for this hour
    const startMin = hour * 60
    const endMin = (hour + 1) * 60
    
    // Find occupied ranges in this hour to detect next available slot
    const occupied = normalizedBlocks
      .filter(b => {
        const bStart = b.hour * 60 + (b.start_offset || 0)
        const bEnd = bStart + b.duration_minutes
        return bStart < endMin && bEnd > startMin
      })
      .map(b => {
        const bStart = b.hour * 60 + (b.start_offset || 0)
        const bEnd = bStart + b.duration_minutes
        // Clamp to this hour
        return {
          start: Math.max(startMin, bStart),
          end: Math.min(endMin, bEnd)
        }
      })
      .sort((a, b) => a.end - b.end)
    
    // If user clicked explicitly on a block, handleBlockClick would have fired.
    // Here we are on the cell background.
    // Try to find if we are clicking in a gap?
    // For simplicity per user request: "click on the 9AM block... add new task START ONLY FROM 9:25AM+"
    // This implies using the latest end time as the start.
    
    let newStartOffset = 0
    if (occupied.length > 0) {
      const lastEnd = occupied[occupied.length - 1].end
      if (lastEnd > startMin) {
        newStartOffset = lastEnd - startMin
      }
    }
    
    if (newStartOffset >= 60) return // Hour is full

    if (selectedCategory) {
      onBlockCreate(hour, selectedCategory, 60, newStartOffset)
    } else {
      setPickerPosition({ x: e.clientX, y: e.clientY, hour, startOffset: newStartOffset })
      setShowCategoryPicker(true)
    }
  }

  const handleBlockClick = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation()
    // Only open picker if this was a click (not a drag/resize)
    if (blockClickRef.current && blockClickRef.current.blockId === blockId) {
      const moved = Math.abs(e.clientX - blockClickRef.current.startX) > 5 || 
                    Math.abs(e.clientY - blockClickRef.current.startY) > 5
      if (!moved) {
        setPickerPosition({ x: e.clientX, y: e.clientY, blockId })
        setShowCategoryPicker(true)
      }
      blockClickRef.current = null
    }
  }

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string, edge: 'right') => {
    e.stopPropagation()
    e.preventDefault()

    const block = normalizedBlocks.find(b => b.id === blockId)
    if (!block || !gridRef.current) return

    setResizingBlock({ id: blockId, edge })
    setDragStartData({
      mouseX: e.clientX,
      originalDuration: block.duration_minutes,
      hasMoved: false
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartData || !gridRef.current || !resizingBlock) return

    const rect = gridRef.current.getBoundingClientRect()
    // Calculate width of one minute in pixels (approx)
    // columns, minus gaps. simplified: total width / columns / 60
    const gaps = columns - 1
    const oneMinutePx = (rect.width - (gaps * 4)) / columns / 60
    
    const deltaX = e.clientX - dragStartData.mouseX
    const deltaMinutes = Math.round(deltaX / oneMinutePx)

    // Mark as moved if there's any movement
    if (Math.abs(deltaX) > 2 && !dragStartData.hasMoved) {
      setDragStartData(prev => prev ? { ...prev, hasMoved: true } : null)
    }

    if (resizingBlock.edge === 'right') {
      const block = normalizedBlocks.find(b => b.id === resizingBlock.id)
      if (block) {
        // Allow smooth resizing with 5m snap (requested "custom width")
        let newDuration = dragStartData.originalDuration + deltaMinutes
        // Snap to nearest 5 minutes
        newDuration = Math.round(newDuration / 5) * 5
        newDuration = Math.max(15, newDuration) // Minimum 15 mins
        
        // Prevent overlap with next block
        const nextBlock = normalizedBlocks
          .filter(b => b.id !== block.id && b.hour >= block.hour)
          .sort((a, b) => a.hour - b.hour)[0]
        
        if (nextBlock) {
          const minutesUntilNext = (nextBlock.hour * 60) - (block.hour * 60)
          newDuration = Math.min(newDuration, minutesUntilNext)
        }
        
        // Prevent overflowing day (24:00)
        const minutesUntilEndOfDay = (24 * 60) - (block.hour * 60)
        newDuration = Math.min(newDuration, minutesUntilEndOfDay)

        if (newDuration !== block.duration_minutes && newDuration > 0) {
          onBlockUpdate(resizingBlock.id, { duration_minutes: newDuration })
        }
      }
    }
  }, [resizingBlock, dragStartData, normalizedBlocks, onBlockUpdate, columns])

  const handleMouseUp = useCallback(() => {
    // Clear click tracking if mouseup without click event
    setTimeout(() => {
      blockClickRef.current = null
    }, 100)
    setResizingBlock(null)
    setDragStartData(null)
  }, [])

  // Attach global listeners
  useEffect(() => {
    if (resizingBlock) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizingBlock, handleMouseMove, handleMouseUp])

  const handleCategorySelect = (categoryId: string) => {
    if (pickerPosition?.blockId) {
      // Update existing block's category
      onBlockUpdate(pickerPosition.blockId, { category_id: categoryId })
    } else if (pickerPosition?.hour !== undefined) {
      // Create new block
      onBlockCreate(pickerPosition.hour, categoryId, 60, pickerPosition.startOffset || 0)
    }
    setShowCategoryPicker(false)
    setPickerPosition(null)
  }

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

      {/* Grid container - 4 columns on mobile, 8 columns on desktop */}
      <div
        ref={gridRef}
        className="grid grid-cols-4 md:grid-cols-8 gap-1 select-none relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Static grid cells - visual only, NO block logic */}
        {Array.from({ length: 24 }, (_, hour) => {
          return (
            <div
              key={`cell-${hour}`}
              className="hour-cell relative aspect-[1.2] cursor-pointer group rounded-xl overflow-hidden z-0 pointer-events-auto bg-white/5"
              onClick={(e) => handleCellClick(hour, e)}
              onContextMenu={(e) => {
                e.preventDefault()
                const clickedBlock = normalizedBlocks.find(log => {
                  const endHour = log.hour + Math.ceil(log.duration_minutes / 60)
                  return hour >= log.hour && hour < endHour
                })
                if (clickedBlock) {
                  onBlockDelete(clickedBlock.id)
                } else {
                  handleCellClick(hour, e)
                }
              }}
              title={formatHour(hour)}
            >
              {/* Hour label */}
              <span className="absolute top-1.5 left-2 text-[9px] font-mono text-muted group-hover:text-secondary transition-opacity z-10">
                {formatHour(hour)}
              </span>
              
              {/* Hover state */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
            </div>
          )
        })}

        {/* Blocks Layer - using global absolute positioning for pixel-perfect spanning */}
        <div className="absolute inset-0 pointer-events-none">
          {visualSegments.map(segment => {
            const blockColor = getCategoryColor(segment.category)
            const gapSize = 4 // 4px gap
            
            // Calculate position percentages
            // left: col * (100%/8) + gaps? No, simpler to use calc
            // Width of one column-slot (col + gap) is 1/8th of container width? 
            // Actually tailwind grid-cols-8 gap-1 means:
            // (100% - 7*4px) / 8 is the width of one cell.
            
            // Calculate position using startOffset
            const startOffset = segment.startOffset || 0
            
            // Width calculation: 
            // Total cell width = (100% - 28px)/8
            // 4px gap per cell
            
            // Width = (duration / 60) * cellWidth?
            // Need to account for gaps if spanning.
            
            // Complex Calc:
            // 1. Base width of ONE minute = (100% - 28px) / 8 / 60
            // 2. Base width of duration = duration * oneMinuteWidth
            // 3. PLUS gaps: for every full cell boundary crossed.
            //    Boundary crossing count = floor((startOffset + duration) / 60) - floor(startOffset / 60)?
            //    If startOffset=30, duration=30 -> end=60. 0 crossings.
            //    If startOffset=30, duration=60 -> end=90. 1 crossing (at 60).
            //    Gap is 4px.
            
            // Calculate gaps based on columns
            const gaps = columns - 1
            const totalGapPx = gaps * 4
            
            const cellWidthPercent = `((100% - ${totalGapPx}px) / ${columns})`
            const minuteWidthPercent = `(${cellWidthPercent} / 60)`
            
            const crossings = Math.floor((startOffset + segment.duration - 0.1) / 60)
            const gapPixels = crossings * 4
            
            const widthCalc = `calc((${minuteWidthPercent} * ${segment.duration}) + ${gapPixels}px)`
            
            // Left calculation:
            // Col offset + Start offset within cell
            // Col offset = col * (cellWidth + 4px)
            // Start offset = startOffset * minuteWidth
            
            const colOffsetCalc = `((${cellWidthPercent} + 4px) * ${segment.col})`
            const startOffsetCalc = `(${minuteWidthPercent} * ${startOffset})`
            const leftCalc = `calc(${colOffsetCalc} + ${startOffsetCalc})`
            
            // Vertical calc: rows with gaps
            // Number of rows = Math.ceil(24 / columns)
            const rows = Math.ceil(24 / columns)
            const rowGaps = rows - 1
            const totalRowGapPx = rowGaps * 4
            const rowHeightCalc = `((100% - ${totalRowGapPx}px) / ${rows})`
            const topCalc = `calc((${rowHeightCalc} * ${segment.row}) + ${segment.row * 4}px)`
            const heightCalc = `calc(${rowHeightCalc})`

            return (
              <div
                key={segment.segmentKey}
                className="absolute pointer-events-auto group z-10"
                style={{
                  left: leftCalc,
                  top: topCalc,
                  width: widthCalc,
                  height: heightCalc,
                }}
                title={`${formatHour(segment.hour)} - ${segment.category?.name || 'Uncategorized'} (${segment.duration_minutes}min)`}
              >
                {/* Block content */}
                <div 
                  className="absolute inset-0 flex items-center justify-center px-2 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: blockColor,
                  }}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement
                    if (!target.classList.contains('resize-handle')) {
                      // Click tracking
                      blockClickRef.current = { blockId: segment.id, startX: e.clientX, startY: e.clientY }
                    }
                  }}
                  onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onBlockDelete(segment.id)
                }}
                onClick={(e) => handleBlockClick(e, segment.id)}
                >
                  {/* Block label - only show on first segment */}
                  {segment.isFirst && (
                    <div className={`absolute inset-0 p-1.5 flex flex-col ${segment.duration_minutes < 30 ? 'justify-center' : 'justify-start'} pointer-events-none select-none overflow-hidden`}>
                      <div className="flex flex-col items-start w-full min-w-0">
                        <div className="flex items-center gap-1 text-[9px] leading-none font-mono text-white/60 w-full truncate">
                          <span>
                            {formatTime(segment.hour * 60 + (segment.startOffset || 0))}
                            {segment.duration_minutes > 45 && ` - ${formatTime(segment.hour * 60 + (segment.startOffset || 0) + segment.duration_minutes)}`}
                          </span>
                          {/* Plain text duration for short blocks */}
                          {segment.duration_minutes < 60 && (
                            <span className="opacity-80">
                              • {segment.duration_minutes}m
                            </span>
                          )}
                        </div>
                        
                        {/* Category Name */}
                        {segment.category && (
                          <span className="text-[11px] leading-tight font-semibold text-white/95 truncate w-full mt-0.5">
                            {segment.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right resize handle - ONLY on the last segment */}
                  {segment.isLast && (
                    <div
                      className="resize-handle absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize z-20 opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity rounded-r-xl"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleBlockMouseDown(e, segment.id, 'right')
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category picker popover */}
      {showCategoryPicker && pickerPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowCategoryPicker(false)
              setPickerPosition(null)
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

      {/* Category palette */}
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
