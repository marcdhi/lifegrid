"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { 
  Calendar,
  Grid3x3,
  BarChart3,
  IndianRupee,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart
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
  { label: "Fitness", href: "/fitness", icon: Heart },
  { label: "Spending", href: "/spending", icon: IndianRupee },
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
      className={`fixed left-0 top-0 h-screen bg-black border-r border-white/[0.06] flex flex-col transition-all duration-200 z-50 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/[0.06]">
        {!collapsed && (
          <span className="text-sm font-medium text-primary tracking-tight">
            Lifegrid
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 text-muted hover:text-secondary transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-sm transition-colors ${
                    isActive
                      ? "bg-white/[0.06] text-primary"
                      : "text-muted hover:text-secondary hover:bg-white/[0.03]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-xs">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer - Sign out */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-sm text-muted hover:text-secondary hover:bg-white/[0.03] transition-colors disabled:opacity-50"
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xs">
              {signingOut ? "Signing out..." : "Sign out"}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
