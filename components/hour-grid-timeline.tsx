"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import type { Category, HourLog } from "@/lib/types"
import { formatHour } from "@/lib/utils"
import { HourGridMobile } from "./hour-grid-mobile"

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

function getCategoryColor(category?: Category): string {
  if (!category) return 'var(--overlay-light)' // Light default color from CSS variables
  return category.color // Use color directly from database
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
  const [pickerPosition, setPickerPosition] = useState<{ x: number; y: number; hour?: number; startOffset?: number; duration?: number; blockId?: string } | null>(null)
  const [resizingBlock, setResizingBlock] = useState<{ id: string; edge: 'left' | 'right' } | null>(null)
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

    // Convert all blocks to time ranges and sort by start time
    const timeRanges = normalizedBlocks.map(b => ({
      start: b.hour * 60 + (b.start_offset || 0),
      end: b.hour * 60 + (b.start_offset || 0) + b.duration_minutes,
      id: b.id,
      block: b
    })).sort((a, b) => a.start - b.start)
    
    const clickedMinute = hour * 60
    const clickedHourEnd = (hour + 1) * 60
    const endOfDay = 24 * 60
    
    // Check if there's already a block in this hour (database constraint: unique_day_hour)
    const existingBlockInHour = normalizedBlocks.find(b => b.hour === hour)
    
    if (existingBlockInHour) {
      // Hour already has a block - check for gaps before AND after it
      const blockRange = timeRanges.find(r => r.id === existingBlockInHour.id)
      if (!blockRange) return
      
      // Find previous block
      const prevBlock = timeRanges
        .filter(r => r.end <= blockRange.start)
        .sort((a, b) => b.end - a.end)[0]
      
      // Find next block after this one
      const nextBlock = timeRanges.find(r => r.start > blockRange.end)
      
      // Check gap BEFORE existing block
      const gapBeforeStart = prevBlock ? prevBlock.end : clickedMinute
      const gapBeforeEnd = blockRange.start
      const gapBeforeSize = gapBeforeEnd - gapBeforeStart
      
      // Check gap AFTER existing block
      const gapAfterStart = blockRange.end
      const gapAfterEnd = nextBlock ? nextBlock.start : clickedHourEnd
      const gapAfterSize = gapAfterEnd - gapAfterStart
      
      // Prefer gap after block (since user clicked on the hour, they probably want to add after)
      // But also check gap before if after is too small
      let gapStart: number
      let gapEnd: number
      let gapSize: number
      
      if (gapAfterSize >= 5) {
        // Use gap after block
        gapStart = gapAfterStart
        gapEnd = gapAfterEnd
        gapSize = gapAfterSize
      } else if (gapBeforeSize >= 5) {
        // Use gap before block
        gapStart = gapBeforeStart
        gapEnd = gapBeforeEnd
        gapSize = gapBeforeSize
      } else {
        // No gap available
        return
      }
      
      // Create task in the selected gap
      const gapStartHour = Math.floor(gapStart / 60)
      const gapStartOffset = gapStart % 60
      const duration = gapSize
      
      if (selectedCategory) {
        onBlockCreate(gapStartHour, selectedCategory, duration, gapStartOffset)
      } else {
        setPickerPosition({ x: e.clientX, y: e.clientY, hour: gapStartHour, startOffset: gapStartOffset, duration: duration })
        setShowCategoryPicker(true)
      }
      return
    }
    
    // No block in this hour - check if we can create one
    // Find block that ends before this hour
    const prevBlock = timeRanges
      .filter(r => r.end <= clickedMinute)
      .sort((a, b) => b.end - a.end)[0]
    
    // Find next block (could be in this hour or later)
    const nextBlock = timeRanges.find(r => r.start > clickedMinute)
    
    // Calculate gap
    const gapStart = prevBlock ? prevBlock.end : clickedMinute
    let gapEnd = nextBlock ? nextBlock.start : clickedHourEnd
    gapEnd = Math.min(gapEnd, clickedHourEnd) // Can't exceed hour boundary
    
    const availableSpace = gapEnd - gapStart
    
    if (availableSpace < 5) {
      // No space - try extending previous block instead
      if (prevBlock && gapStart < clickedHourEnd) {
        const extension = Math.min(15, clickedHourEnd - prevBlock.end)
        if (extension >= 5 && (!nextBlock || prevBlock.end + extension <= nextBlock.start)) {
          const newDuration = prevBlock.block.duration_minutes + extension
          onBlockUpdate(prevBlock.id, { duration_minutes: newDuration })
        }
      }
      return
    }
    
    // Can create new block - use actual available space as duration
    const finalHour = hour
    const finalOffset = 0
    const duration = availableSpace

    if (selectedCategory) {
      onBlockCreate(finalHour, selectedCategory, duration, finalOffset)
    } else {
      setPickerPosition({ x: e.clientX, y: e.clientY, hour: finalHour, startOffset: finalOffset, duration: duration })
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

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string, edge: 'left' | 'right') => {
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

  const handleBlockTouchStart = (e: React.TouchEvent, blockId: string, edge: 'left' | 'right') => {
    e.stopPropagation()
    e.preventDefault()

    const block = normalizedBlocks.find(b => b.id === blockId)
    if (!block || !gridRef.current) return

    const touch = e.touches[0]
    setResizingBlock({ id: blockId, edge })
    setDragStartData({
      mouseX: touch.clientX,
      originalDuration: block.duration_minutes,
      hasMoved: false
    })
  }

  const handleMove = useCallback((clientX: number) => {
    if (!dragStartData || !gridRef.current || !resizingBlock) return

    const rect = gridRef.current.getBoundingClientRect()
    // Calculate width of one minute in pixels
    const gaps = columns - 1
    const gapSize = 6 // Updated to match the new gap size
    const oneMinutePx = (rect.width - (gaps * gapSize)) / columns / 60
    
    const deltaX = clientX - dragStartData.mouseX
    const deltaMinutes = Math.round(deltaX / oneMinutePx)

    // Mark as moved if there's any movement
    if (Math.abs(deltaX) > 2 && !dragStartData.hasMoved) {
      setDragStartData(prev => prev ? { ...prev, hasMoved: true } : null)
    }

    const block = normalizedBlocks.find(b => b.id === resizingBlock.id)
    if (!block) return

    const blockStart = block.hour * 60 + (block.start_offset || 0)
    const blockEnd = blockStart + block.duration_minutes

    if (resizingBlock.edge === 'right') {
      // Resize end (duration)
      let newDuration = dragStartData.originalDuration + deltaMinutes
      newDuration = Math.round(newDuration / 5) * 5
      newDuration = Math.max(5, newDuration) // Minimum 5 mins
      
      const newEnd = blockStart + newDuration
      
      // Find next block
      const nextBlock = normalizedBlocks
        .filter(b => b.id !== block.id)
        .map(b => ({
          start: b.hour * 60 + (b.start_offset || 0),
          end: b.hour * 60 + (b.start_offset || 0) + b.duration_minutes,
        }))
        .find(b => b.start >= blockStart)
      
      if (nextBlock && newEnd > nextBlock.start) {
        newDuration = nextBlock.start - blockStart
      }
      
      // Prevent overflow
      const minutesUntilEndOfDay = (24 * 60) - blockStart
      newDuration = Math.min(newDuration, minutesUntilEndOfDay)

      if (newDuration !== block.duration_minutes && newDuration > 0) {
        onBlockUpdate(resizingBlock.id, { duration_minutes: newDuration })
      }
    } else if (resizingBlock.edge === 'left') {
      // Resize start (hour + start_offset)
      let adjustment = deltaMinutes
      adjustment = Math.round(adjustment / 5) * 5
      
      let newStart = blockStart + adjustment
      newStart = Math.max(0, newStart) // Can't go before midnight
      
      // Find previous block
      const prevBlock = normalizedBlocks
        .filter(b => b.id !== block.id)
        .map(b => ({
          start: b.hour * 60 + (b.start_offset || 0),
          end: b.hour * 60 + (b.start_offset || 0) + b.duration_minutes,
        }))
        .filter(b => b.end <= blockStart)
        .sort((a, b) => b.end - a.end)[0]
      
      if (prevBlock && newStart < prevBlock.end) {
        newStart = prevBlock.end
      }
      
      // Calculate new duration
      const newDuration = blockEnd - newStart
      
      if (newDuration >= 5 && newStart !== blockStart) {
        const newHour = Math.floor(newStart / 60)
        const newOffset = newStart % 60
        onBlockUpdate(resizingBlock.id, { 
          hour: newHour, 
          start_offset: newOffset, 
          duration_minutes: newDuration 
        })
      }
    }
  }, [resizingBlock, dragStartData, normalizedBlocks, onBlockUpdate, columns])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX)
  }, [handleMove])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX)
    }
  }, [handleMove])

  const handleMouseUp = useCallback(() => {
    // Clear click tracking if mouseup without click event
    setTimeout(() => {
      blockClickRef.current = null
    }, 100)
    setResizingBlock(null)
    setDragStartData(null)
  }, [])

  // Attach global listeners for both mouse and touch
  useEffect(() => {
    if (resizingBlock) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [resizingBlock, handleMouseMove, handleTouchMove, handleMouseUp])

  const handleCategorySelect = (categoryId: string) => {
    if (pickerPosition?.blockId) {
      // Update existing block's category
      onBlockUpdate(pickerPosition.blockId, { category_id: categoryId })
    } else if (pickerPosition?.hour !== undefined) {
      // Create new block with calculated duration (or default 60 if not set)
      const duration = pickerPosition.duration || 60
      onBlockCreate(pickerPosition.hour, categoryId, duration, pickerPosition.startOffset || 0)
    }
    setShowCategoryPicker(false)
    setPickerPosition(null)
  }

  // Render mobile view on mobile devices
  if (isMobile) {
    return (
      <HourGridMobile
        hours={hours}
        categories={categories}
        onBlockUpdate={onBlockUpdate}
        onBlockCreate={onBlockCreate}
        onBlockDelete={onBlockDelete}
      />
    )
  }

  return (
    <div className="relative">
      {/* Active category indicator - cleaner */}
      {selectedCategory && (
        <div className="mb-3 flex items-center gap-2 py-2 px-3 bg-white/[0.04] rounded-lg border border-white/[0.08]">
          <div
            className="w-2.5 h-2.5 rounded"
            style={{
              backgroundColor: getCategoryColor(categories.find(c => c.id === selectedCategory))
            }}
          />
          <span className="text-sm text-secondary font-medium">
            {categories.find(c => c.id === selectedCategory)?.name || 'Unknown'}
          </span>
          <button
            onClick={() => setSelectedCategory(null)}
            className="ml-auto text-xs text-muted hover:text-secondary transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Grid container - cleaner spacing */}
      <div
        ref={gridRef}
        className="grid grid-cols-4 md:grid-cols-8 gap-1.5 select-none relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Static grid cells - cleaner design */}
        {Array.from({ length: 24 }, (_, hour) => {
          return (
            <div
              key={`cell-${hour}`}
              className="hour-cell relative aspect-[1.2] cursor-pointer group rounded-lg overflow-hidden z-0 pointer-events-auto bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
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
              {/* Hour label - cleaner */}
              <span className="absolute top-1 left-1.5 text-[8px] font-mono text-muted/50 group-hover:text-secondary/70 transition-colors z-10">
                {formatHour(hour)}
              </span>
            </div>
          )
        })}

        {/* Blocks Layer - using global absolute positioning for pixel-perfect spanning */}
        <div className="absolute inset-0 pointer-events-none">
          {visualSegments.map(segment => {
            const blockColor = getCategoryColor(segment.category)
            
            // Calculate position using startOffset
            const startOffset = segment.startOffset || 0
            
            // Calculate gaps based on columns (6px gap for better spacing)
            const gaps = columns - 1
            const gapSize = 6
            const totalGapPx = gaps * gapSize
            
            const cellWidthPercent = `((100% - ${totalGapPx}px) / ${columns})`
            const minuteWidthPercent = `(${cellWidthPercent} / 60)`
            
            const crossings = Math.floor((startOffset + segment.duration - 0.1) / 60)
            const gapPixels = crossings * gapSize
            
            const widthCalc = `calc((${minuteWidthPercent} * ${segment.duration}) + ${gapPixels}px)`
            
            // Left calculation
            const colOffsetCalc = `((${cellWidthPercent} + ${gapSize}px) * ${segment.col})`
            const startOffsetCalc = `(${minuteWidthPercent} * ${startOffset})`
            const leftCalc = `calc(${colOffsetCalc} + ${startOffsetCalc})`
            
            // Vertical calc
            const rows = Math.ceil(24 / columns)
            const rowGaps = rows - 1
            const totalRowGapPx = rowGaps * gapSize
            const rowHeightCalc = `((100% - ${totalRowGapPx}px) / ${rows})`
            const topCalc = `calc((${rowHeightCalc} * ${segment.row}) + ${segment.row * gapSize}px)`
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
                {/* Block content - cleaner design */}
                <div 
                  className="absolute inset-0 rounded-lg overflow-hidden shadow-sm border border-white/10"
                  style={{
                    backgroundColor: blockColor,
                  }}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement
                    if (!target.classList.contains('resize-handle')) {
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
                  {/* Content - only show on first segment */}
                  {segment.isFirst && (
                    <>
                      {/* Large/Medium blocks - horizontal layout */}
                      {segment.duration_minutes >= 30 && (
                        <div className="absolute inset-0 p-2 flex flex-col pointer-events-none select-none">
                          {/* Category name */}
                          {segment.category && (
                            <span className="text-sm font-semibold text-white/95 leading-tight mb-1 truncate">
                              {segment.category.name}
                            </span>
                          )}
                          
                          {/* Time range */}
                          <div className="flex items-center gap-1 text-xs font-mono text-white/80">
                            <span>{formatTime(segment.hour * 60 + (segment.startOffset || 0))}</span>
                            <span>-</span>
                            <span>{formatTime(segment.hour * 60 + (segment.startOffset || 0) + segment.duration_minutes)}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Small blocks - vertical text */}
                      {segment.duration_minutes < 30 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                          <div className="flex flex-col items-center gap-1">
                            {/* Category name - vertical */}
                            {segment.category && (
                              <span 
                                className="text-sm font-bold text-white/95 tracking-wider"
                                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                              >
                                {segment.category.name}
                              </span>
                            )}
                            {/* Duration */}
                            <span className="text-[9px] font-medium text-white/80">
                              {segment.duration_minutes}m
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Left resize handle - adjust start time */}
                  {segment.isFirst && (
                    <div
                      className={`resize-handle absolute left-0 top-0 bottom-0 z-20 transition-all rounded-l-lg ${
                        isMobile 
                          ? 'w-8 bg-black/20 active:bg-black/30' 
                          : 'w-3 opacity-0 group-hover:opacity-100 hover:bg-black/20'
                      } cursor-ew-resize flex items-center justify-center`}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleBlockMouseDown(e, segment.id, 'left')
                      }}
                      onTouchStart={(e) => handleBlockTouchStart(e, segment.id, 'left')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isMobile && (
                        <div className="w-0.5 h-6 bg-white/40 rounded-full" />
                      )}
                    </div>
                  )}

                  {/* Right resize handle - adjust end time/duration */}
                  {segment.isLast && (
                    <div
                      className={`resize-handle absolute right-0 top-0 bottom-0 z-20 transition-all rounded-r-lg ${
                        isMobile 
                          ? 'w-8 bg-black/20 active:bg-black/30' 
                          : 'w-3 opacity-0 group-hover:opacity-100 hover:bg-black/20'
                      } cursor-ew-resize flex items-center justify-center`}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleBlockMouseDown(e, segment.id, 'right')
                      }}
                      onTouchStart={(e) => handleBlockTouchStart(e, segment.id, 'right')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isMobile && (
                        <div className="w-0.5 h-6 bg-white/40 rounded-full" />
                      )}
                    </div>
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
                  <span className="text-sm text-secondary group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Category palette - cleaner */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-left ${
                selectedCategory === category.id
                  ? 'bg-white/[0.1] ring-1 ring-white/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              <div
                className="w-2 h-2 rounded flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(category) }}
              />
              <span className={`text-sm font-medium ${
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
