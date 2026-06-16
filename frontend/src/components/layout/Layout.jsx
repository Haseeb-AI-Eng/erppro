import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handle = (e) => setIsMobile(e.matches)
    handle(mq)
    mq.addEventListener?.('change', handle)
    return () => mq.removeEventListener?.('change', handle)
  }, [])

  useEffect(() => {
    // default sidebar open on desktop, closed on mobile
    setSidebarOpen(!isMobile)
  }, [isMobile])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} isMobile={isMobile} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
