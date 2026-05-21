import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { LayoutDashboard, Users, Clock, CheckSquare, DollarSign, Bell, User, MessageSquare, Calendar, BarChart2, Bot, Building2, LogOut, Zap, ChevronLeft } from 'lucide-react'

const employeeItems = [
  { to: '/attendance', icon: Clock, label: 'Attendance' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' }
]

const managerItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/attendance', icon: Clock, label: 'Attendance' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/payroll', icon: DollarSign, label: 'Payroll' },
  { to: '/leaves', icon: Calendar, label: 'Leaves' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' }
]

const adminItems = [
  { to: '/admin', icon: Zap, label: 'Admin Panel' },
  { to: '/admin/organizations', icon: Building2, label: 'Organizations' }
]

export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'super_admin'
  const items = isSuperAdmin ? adminItems : user?.role === 'employee' ? employeeItems : managerItems

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ width: open ? 220 : 60 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {open && <span className="font-bold text-slate-900 text-sm whitespace-nowrap">ShineERP</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} className="shrink-0" />
              {open && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-2 border-t border-slate-200">
          {open && (
            <div className="px-3 py-2 mb-1">
              <p className="text-slate-900 text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} className="shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
