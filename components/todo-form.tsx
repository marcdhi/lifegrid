"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Plus } from "lucide-react"

interface TodoFormProps {
  onAdd: (title: string) => void
  isLoading?: boolean
}

export function TodoForm({ onAdd, isLoading }: TodoFormProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onAdd(input)
      setInput("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Add a new todo..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading} className="gap-2">
        <Plus className="h-4 w-4" />
        Add
      </Button>
    </form>
  )
}
