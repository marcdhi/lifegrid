"use client"

import { Sidebar } from "@/components/sidebar"
import { useState, useEffect } from "react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setSidebarCollapsed(saved === 'true')
    
    // Listen for storage changes
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem('sidebar-collapsed') === 'true'
      setSidebarCollapsed(collapsed)
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event for same-tab updates
    const handleLocalUpdate = () => {
      const collapsed = localStorage.getItem('sidebar-collapsed') === 'true'
      setSidebarCollapsed(collapsed)
    }
    
    // Poll for changes (simpler than custom events)
    const interval = setInterval(handleLocalUpdate, 100)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? 'ml-14' : 'ml-56'}`}>
        {children}
      </main>
    </div>
  )
}

