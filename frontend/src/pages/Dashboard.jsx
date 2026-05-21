import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Clock, CheckSquare, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444']

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
    refetchInterval: 60000
  })

  const stats = data?.stats || {}
  const trend = data?.attendanceTrend || []
  const taskDist = data?.taskDistribution || []

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees || 0, icon: Users, color: 'from-blue-500 to-blue-600', change: '+2' },
    { label: 'Present Today', value: stats.presentToday || 0, icon: Clock, color: 'from-green-500 to-green-600', change: `${stats.presentToday || 0}/${stats.activeEmployees || 0}` },
    { label: 'Pending Tasks', value: stats.pendingTasks || 0, icon: CheckSquare, color: 'from-yellow-500 to-yellow-600', change: `${stats.overdueTasks || 0} overdue` },
    { label: 'Monthly Payroll', value: `$${(stats.totalPayroll || 0).toLocaleString()}`, icon: DollarSign, color: 'from-primary-500 to-primary-600', change: `$${(stats.paidPayroll || 0).toLocaleString()} paid` },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, <span className="text-primary-600">{user?.name}</span> — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Alerts */}
      {stats.overdueTasks > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm"><strong>{stats.overdueTasks}</strong> tasks are overdue. <Link to="/tasks" className="underline">Review now</Link></p>
        </div>
      )}
      {stats.pendingLeaves > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <Calendar size={18} className="text-yellow-500 shrink-0" />
          <p className="text-yellow-700 text-sm"><strong>{stats.pendingLeaves}</strong> leave requests pending approval. <Link to="/leaves" className="underline">Review now</Link></p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.change}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon size={18} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend */}
        <div className="card">
          <h3 className="text-slate-900 font-semibold mb-4">Attendance This Week</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
              <Area type="monotone" dataKey="present" stroke="#6366f1" fill="url(#attGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution */}
        <div className="card">
          <h3 className="text-slate-900 font-semibold mb-4">Task Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={taskDist.map(t => ({ name: t._id, value: t.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {taskDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {taskDist.map((t, i) => (
                <div key={t._id} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500 capitalize">{t._id?.replace('_', ' ')}</span>
                  <span className="text-slate-900 ml-auto font-medium">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      {data?.recentAttendance?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 font-semibold">Today's Attendance</h3>
            <Link to="/attendance" className="text-primary-600 text-sm hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-2">
            {data.recentAttendance.map(att => (
              <div key={att._id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {att.employeeId?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 text-sm font-medium">{att.employeeId?.name}</p>
                  <p className="text-slate-400 text-xs">{att.employeeId?.department}</p>
                </div>
                <span className={`badge ${att.status === 'present' ? 'status-present' : att.status === 'late' ? 'status-late' : 'status-absent'}`}>
                  {att.status}
                </span>
                <span className="text-slate-400 text-xs">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}