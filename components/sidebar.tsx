"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { 
  Calendar,
  Grid3x3,
  BarChart3,
  DollarSign,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Today", href: "/today", icon: Calendar },
  { label: "Year", href: "/year", icon: Grid3x3 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Spending", href: "/spending", icon: DollarSign },
  { label: "Reflection", href: "/reflection", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/auth")
  }

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(saved === 'true')
  }, [])

  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 z-50 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-sidebar-foreground tracking-tight">
            Lifegrid
          </h1>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 hover:bg-sidebar-accent rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer - Sign out */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors disabled:opacity-50"
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">
              {signingOut ? "Signing out..." : "Sign out"}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

