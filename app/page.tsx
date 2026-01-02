"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TodoForm } from "@/components/todo-form"
import { TodoItem } from "@/components/todo-item"

interface Todo {
  id: string
  title: string
  completed: boolean
}

export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  // Fetch todos on mount
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const { data, error } = await supabase.from("todos").select("*").order("created_at", { ascending: false })

        if (error) throw error
        setTodos(data || [])
      } catch (error) {
        console.error("Error fetching todos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodos()
  }, [supabase])

  const handleAdd = async (title: string) => {
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.from("todos").insert({ title }).select()

      if (error) throw error
      if (data) {
        setTodos([data[0], ...todos])
      }
    } catch (error) {
      console.error("Error adding todo:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("todos").update({ completed }).eq("id", id)

      if (error) throw error
      setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed } : todo)))
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", id)

      if (error) throw error
      setTodos(todos.filter((todo) => todo.id !== id))
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Lifegrid</h1>
            <p className="text-muted-foreground">Organize your tasks and stay productive</p>
          </div>

          <TodoForm onAdd={handleAdd} isLoading={isSubmitting} />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No todos yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  id={todo.id}
                  title={todo.title}
                  completed={todo.completed}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  isLoading={isSubmitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
