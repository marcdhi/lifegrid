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
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  )
}

