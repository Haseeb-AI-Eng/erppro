import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function TopBar({ onMenuClick }) {
  const { user } = useAuthStore()
  const [dark, setDark] = useState(true)

  const { data } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
    enabled: !!user
  })

  const unread = data?.unreadCount || 0

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
      <button onClick={onMenuClick} className="text-slate-500 hover:text-slate-900 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 py-1.5 text-sm" placeholder="Search employees, tasks..." />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Link to="/notifications" className="relative text-slate-500 hover:text-slate-900 transition-colors">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
        <Link to="/profile">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  )
}
