import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Users, TrendingUp, Activity, Loader } from 'lucide-react'
import api from '../../services/api'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data) })
  const stats = data?.stats || {}
  const recent = data?.recentOrgs || []

  const cards = [
    { label: 'Total Organizations', value: stats.totalOrgs || 0, icon: Building2, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Organizations', value: stats.activeOrgs || 0, icon: Activity, color: 'from-green-500 to-green-600' },
    { label: 'Total Employees', value: stats.totalEmployees || 0, icon: Users, color: 'from-primary-500 to-primary-600' },
    { label: 'Pending Approvals', value: stats.pendingOrgs || 0, icon: TrendingUp, color: 'from-orange-500 to-orange-600' },
  ]

  if (isLoading) return <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400"/></div>

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Panel</h1>
        <p className="text-gray-400 text-sm">Platform overview and control center</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">{c.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{c.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon size={22} className="text-white"/>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recently Registered Organizations</h3>
          <Link to="/admin/organizations" className="text-primary-400 text-sm hover:text-primary-300">View all</Link>
        </div>
        <div className="space-y-3">
          {recent.map(org => (
            <div key={org._id} className="flex items-center gap-3 py-2 border-b border-dark-400 last:border-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {org.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{org.name}</p>
                <p className="text-gray-500 text-xs">{org.industry} · {org.size} employees · Code: <span className="font-mono text-primary-400">{org.code}</span></p>
              </div>
              <div className="text-right">
                <span className={`badge ${org.status==='active'?'status-present':org.status==='pending'?'status-pending':'status-rejected'}`}>{org.status}</span>
                <p className="text-gray-500 text-xs mt-1">{formatDistanceToNow(new Date(org.createdAt), {addSuffix:true})}</p>
              </div>
            </div>
          ))}
          {!recent.length && <p className="text-gray-500 text-sm text-center py-6">No organizations yet</p>}
        </div>
      </div>
    </div>
  )
}
