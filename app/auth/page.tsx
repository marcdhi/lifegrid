"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs space-y-10">
        {/* Header - minimal */}
        <div className="space-y-3 text-center">
          <h1 className="text-xl font-light tracking-tight text-primary">
            Lifegrid
          </h1>
          <p className="text-xs text-muted">
            Track your life, one hour at a time
          </p>
        </div>

        {/* Mode toggle - minimal */}
        <div className="flex justify-center gap-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              mode === "login" ? "text-primary" : "text-muted hover:text-secondary"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              mode === "signup" ? "text-primary" : "text-muted hover:text-secondary"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Form - inline, minimal */}
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="email" className="text-[10px] uppercase tracking-wider text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              autoComplete="email"
              className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-[10px] uppercase tracking-wider text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              className="w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-white/[0.12] py-2 text-sm text-primary outline-none transition-colors placeholder:text-muted"
            />
          </div>

          {error && (
            <p className="text-xs text-[#8B3A3A]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-[11px] uppercase tracking-wider text-secondary hover:text-primary border border-white/[0.06] hover:border-white/[0.12] rounded-sm transition-colors disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  )
}
