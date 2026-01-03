"use client"

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagInputProps {
  label?: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  suggestions?: Array<{ id: string; name: string; count?: number }>
  placeholder?: string
  className?: string
}

export function TagInput({
  label,
  tags,
  onTagsChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  className
}: TagInputProps) {
  const [input, setInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = suggestions.filter(
    s => s.name.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s.name)
  ).slice(0, 5)

  const addTag = (tagName: string) => {
    const normalized = tagName.trim().toLowerCase()
    if (normalized && !tags.includes(normalized)) {
      onTagsChange([...tags, normalized])
    }
    setInput("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagName: string) => {
    onTagsChange(tags.filter(t => t !== tagName))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === ',' && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    setShowSuggestions(value.trim().length > 0 && filteredSuggestions.length > 0)
  }

  return (
    <div className={cn("space-y-1 relative", className)}>
      {label && (
        <label className="text-[11px] tracking-wide text-muted font-medium">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Tags display */}
        <div className="min-h-[44px] bg-input rounded-lg px-3 py-2 flex flex-wrap gap-1.5 border border-transparent focus-within:border-white/[0.08] transition-all">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-secondary bg-white/[0.06] rounded-lg"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => input.trim() && setShowSuggestions(filteredSuggestions.length > 0)}
            placeholder={tags.length === 0 ? placeholder : "Add more..."}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-primary outline-none placeholder:text-muted"
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSuggestions(false)}
            />
            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-popover border border-white/[0.06] rounded-lg overflow-hidden shadow-lg">
              {filteredSuggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => addTag(suggestion.name)}
                  className="w-full text-left px-3 py-2 text-sm text-secondary hover:bg-white/[0.04] transition-colors flex items-center justify-between"
                >
                  <span>{suggestion.name}</span>
                  {suggestion.count !== undefined && (
                    <span className="text-xs text-muted">×{suggestion.count}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      <p className="text-xs text-muted">
        Separate with Enter or comma
      </p>
    </div>
  )
}

