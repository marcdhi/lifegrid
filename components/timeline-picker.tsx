"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import type { HourLog, Category } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TimelinePickerProps {
  existingLogs: HourLog[]
  categories: Category[]
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  onTimeChange: (start: string, end: string) => void
  selectedCategory?: Category
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  if (minutes === 0) return `${displayHour}${period}`
  return `${displayHour}:${minutes.toString().padStart(2, '0')}${period}`
}

function timeStringToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function TimelinePicker({ 
  existingLogs, 
  categories, 
  startTime, 
  endTime, 
  onTimeChange,
  selectedCategory 
}: TimelinePickerProps) {
  const timelineRef = useRef<HTMLDivElement>(null)

  // Convert logs to time blocks
  const timeBlocks = useMemo(() => {
    return existingLogs.map(log => {
      const category = categories.find(c => c.id === log.category_id)
      return {
        id: log.id,
        start: log.hour * 60 + (log.start_offset || 0),
        end: log.hour * 60 + (log.start_offset || 0) + log.duration_minutes,
        category,
        color: category?.color || '#666'
      }
    }).sort((a, b) => a.start - b.start)
  }, [existingLogs, categories])

  const currentStart = timeStringToMinutes(startTime)
  const currentEnd = timeStringToMinutes(endTime)
  const duration = currentEnd - currentStart

  // Find gaps and overlaps
  const { hasOverlap, overlappingBlock, suggestedSlots } = useMemo(() => {
    const hasOverlap = timeBlocks.some(block => 
      (currentStart >= block.start && currentStart < block.end) ||
      (currentEnd > block.start && currentEnd <= block.end) ||
      (currentStart <= block.start && currentEnd >= block.end)
    )
    
    const overlappingBlock = timeBlocks.find(block => 
      (currentStart >= block.start && currentStart < block.end) ||
      (currentEnd > block.start && currentEnd <= block.end) ||
      (currentStart <= block.start && currentEnd >= block.end)
    )

    // Find gaps where this task could fit
    const gaps = []
    let lastEnd = 0
    for (const block of timeBlocks) {
      if (block.start > lastEnd && block.start - lastEnd >= duration) {
        gaps.push({ start: lastEnd, end: block.start })
      }
      lastEnd = Math.max(lastEnd, block.end)
    }
    // Add final gap to end of day
    if (1440 - lastEnd >= duration) {
      gaps.push({ start: lastEnd, end: 1440 })
    }

    return { hasOverlap, overlappingBlock, suggestedSlots: gaps.slice(0, 3) }
  }, [timeBlocks, currentStart, currentEnd, duration])

  // Quick time adjustment buttons
  const adjustTime = (minutes: number) => {
    const newStart = Math.max(0, Math.min(currentStart + minutes, 1440 - duration))
    const newEnd = newStart + duration
    onTimeChange(minutesToTimeString(newStart), minutesToTimeString(newEnd))
  }

  const adjustDuration = (minutes: number) => {
    const newDuration = Math.max(5, duration + minutes)
    const newEnd = Math.min(currentStart + newDuration, 1440)
    onTimeChange(startTime, minutesToTimeString(newEnd))
  }

  return (
    <div className="space-y-3">
      {/* Visual Timeline - Read-only, shows context */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted uppercase tracking-wider">Your Day</label>
          <span className="text-sm text-secondary font-medium">
            {formatTime(currentStart)} → {formatTime(currentEnd)}
          </span>
        </div>
        
        <div className="relative overflow-x-auto pb-1">
          <div className="relative min-w-[600px]">
            <div 
              ref={timelineRef}
              className="relative h-10 bg-white/5 rounded-lg border border-white/10"
            >
              {/* Hour markers */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex-1 border-l border-white/5 first:border-l-0 relative">
                    <span className="absolute top-1 left-1 text-[7px] text-muted/40 font-mono">
                      {i}
                    </span>
                  </div>
                ))}
              </div>

              {/* Existing blocks */}
              {timeBlocks.map(block => (
                <div
                  key={block.id}
                  className="absolute top-1 bottom-1 rounded opacity-40"
                  style={{
                    left: `${(block.start / 1440) * 100}%`,
                    width: `${((block.end - block.start) / 1440) * 100}%`,
                    backgroundColor: block.color
                  }}
                  title={`${block.category?.name || 'Task'}: ${formatTime(block.start)} - ${formatTime(block.end)}`}
                />
              ))}

              {/* Current task preview */}
              <div
                className={cn(
                  "absolute top-1 bottom-1 rounded border transition-all pointer-events-none",
                  hasOverlap ? "border-red-400/60 bg-red-500/20" : "border-primary/60 bg-primary/20"
                )}
                style={{
                  left: `${(currentStart / 1440) * 100}%`,
                  width: `${(duration / 1440) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overlap warning */}
      {hasOverlap && overlappingBlock && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400 leading-snug">
            ⚠️ Overlaps with <strong>{overlappingBlock.category?.name}</strong> ({formatTime(overlappingBlock.start)}-{formatTime(overlappingBlock.end)})
          </p>
        </div>
      )}

      {/* Suggested slots */}
      {hasOverlap && suggestedSlots.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted shrink-0">Try:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {suggestedSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => {
                  const newStart = slot.start
                  const newEnd = Math.min(newStart + duration, slot.end, 1440)
                  onTimeChange(minutesToTimeString(newStart), minutesToTimeString(newEnd))
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-sm text-secondary hover:text-primary transition-all whitespace-nowrap font-medium"
              >
                {formatTime(slot.start)}-{formatTime(Math.min(slot.start + duration, slot.end))}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Controls - Simple buttons + inputs */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {/* Start time */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted uppercase tracking-wider">Start Time</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => adjustTime(-15)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-secondary hover:text-primary transition-all"
              >
                -15m
              </button>
              <input
                type="time"
                value={startTime}
                onChange={(e) => onTimeChange(e.target.value, endTime)}
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-primary focus:outline-none focus:border-primary/50 font-mono text-center"
              />
              <button
                onClick={() => adjustTime(15)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-secondary hover:text-primary transition-all"
              >
                +15m
              </button>
            </div>
          </div>
          
          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted uppercase tracking-wider">Duration</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => adjustDuration(-15)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-secondary hover:text-primary transition-all"
              >
                -15m
              </button>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-primary font-mono text-center">
                {Math.floor(duration / 60)}h {duration % 60}m
              </div>
              <button
                onClick={() => adjustDuration(15)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-secondary hover:text-primary transition-all"
              >
                +15m
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

