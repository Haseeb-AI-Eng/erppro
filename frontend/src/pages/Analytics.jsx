import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Award, Loader } from 'lucide-react'
import api from '../services/api'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#3b82f6']

export default function Analytics() {
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/analytics/dashboard').then(r => r.data) })
  const { data: deptData } = useQuery({ queryKey: ['dept-analytics'], queryFn: () => api.get('/analytics/departments').then(r => r.data) })
  const { data: leaderData } = useQuery({ queryKey: ['leaderboard'], queryFn: () => api.get('/analytics/leaderboard').then(r => r.data) })

  const trend = dash?.attendanceTrend || []
  const taskDist = dash?.taskDistribution || []
  const departments = deptData?.departments || []
  const leaders = leaderData?.leaderboard || []

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-gray-400 text-sm">Organization performance insights</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary-400"/>Attendance Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill:'#6b7280',fontSize:11}} tickFormatter={v=>v.slice(5)}/>
              <YAxis tick={{fill:'#6b7280',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #2d2d5e',borderRadius:8,color:'#fff'}}/>
              <Area type="monotone" dataKey="present" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} name="Present"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Users size={16} className="text-primary-400"/>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departments.map(d => ({name: d._id || 'Unknown', count: d.count}))}>
              <XAxis dataKey="name" tick={{fill:'#6b7280',fontSize:10}}/>
              <YAxis tick={{fill:'#6b7280',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #2d2d5e',borderRadius:8,color:'#fff'}}/>
              <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} name="Employees"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Task Status Overview</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={taskDist.map(t => ({name: t._id, value: t.count}))} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {taskDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #2d2d5e',borderRadius:8,color:'#fff'}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {taskDist.map((t, i) => (
                <div key={t._id} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{background: COLORS[i % COLORS.length]}}/>
                  <span className="text-gray-400 capitalize flex-1">{t._id?.replace('_',' ')}</span>
                  <span className="text-white font-medium">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Leaderboard */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Award size={16} className="text-yellow-400"/>Performance Leaderboard</h3>
          <div className="space-y-2">
            {leaders.map((emp, i) => (
              <motion.div key={emp._id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-gray-400 text-black':i===2?'bg-orange-700 text-white':'bg-dark-600 text-gray-400'}`}>
                  {i + 1}
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {emp.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{emp.name}</p>
                  <p className="text-gray-500 text-xs">{emp.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-400 font-bold text-sm">{emp.performanceScore}</p>
                  <p className="text-gray-500 text-xs">score</p>
                </div>
              </motion.div>
            ))}
            {!leaders.length && <p className="text-gray-500 text-sm text-center py-6">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
