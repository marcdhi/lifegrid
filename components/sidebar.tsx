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
  Heart,
  Menu,
  X,
  Users
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
  { label: "Friends", href: "/friends", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
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

  const handleNavClick = () => {
    setMobileDrawerOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-sidebar border border-sidebar-border rounded-full shadow-lg text-secondary hover:text-primary transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-200 z-50 ${
          collapsed ? "w-14" : "w-56"
        }`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4">
          {!collapsed && (
            <span className="text-sm font-medium text-primary tracking-tight">
              Lifegrid
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 text-muted hover:text-secondary transition-colors rounded-lg"
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
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-white/[0.08] text-primary"
                        : "text-muted hover:text-secondary hover:bg-white/[0.03]"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer - Sign out */}
        <div className="p-2">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-muted hover:text-secondary hover:bg-white/[0.03] transition-colors disabled:opacity-50"
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm">
                {signingOut ? "Signing out..." : "Sign out"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/80"
          onClick={() => setMobileDrawerOpen(false)}
        />
        
        {/* Drawer */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border rounded-t-2xl shadow-2xl transition-transform duration-300 ${
            mobileDrawerOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
            <span className="text-sm font-medium text-primary tracking-tight">
              Lifegrid
            </span>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1.5 text-muted hover:text-secondary transition-colors rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="py-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/[0.08] text-primary"
                          : "text-muted hover:text-secondary hover:bg-white/[0.03]"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer - Sign out */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted hover:text-secondary hover:bg-white/[0.03] transition-colors disabled:opacity-50"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                {signingOut ? "Signing out..." : "Sign out"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
