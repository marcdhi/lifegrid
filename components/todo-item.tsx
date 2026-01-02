"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface TodoItemProps {
  id: string
  title: string
  completed: boolean
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function TodoItem({ id, title, completed, onToggle, onDelete, isLoading }: TodoItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-secondary transition-colors">
      <Checkbox
        checked={completed}
        onCheckedChange={(checked) => onToggle(id, checked as boolean)}
        disabled={isLoading}
        className="mt-0.5"
      />
      <span className={`flex-1 ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{title}</span>
      <Button variant="ghost" size="sm" onClick={() => onDelete(id)} disabled={isLoading} className="h-8 w-8 p-0">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
