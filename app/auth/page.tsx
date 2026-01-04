"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { TextField } from "@/components/ui/text-field"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "signup"

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Auto-detect timezone for new signups
  const [timezone, setTimezone] = useState<string>("")
  
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              timezone,
            },
          },
        })

        if (signUpError) throw signUpError

        // After signup, automatically sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
        
        router.push("/today")
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
        
        router.push("/today")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-light tracking-tight text-primary">
            Lifegrid
          </h1>
          <p className="text-sm text-muted">
            Track your life, one hour at a time
          </p>
        </div>

        {/* Auth Card */}
        <Card className="p-6 space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
              }}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                mode === "login" 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-muted hover:text-secondary"
              )}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup")
                setError(null)
              }}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                mode === "signup" 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-muted hover:text-secondary"
              )}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              autoComplete="email"
              error={error && mode === "login" ? error : undefined}
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              error={error && mode === "signup" ? error : undefined}
            />

            {error && !error.includes("email") && !error.includes("password") && (
              <p className="text-xs text-destructive px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
