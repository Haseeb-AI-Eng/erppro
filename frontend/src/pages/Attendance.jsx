import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'

export default function Attendance() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState('my')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: todayAtt } = useQuery({ queryKey: ['attendance-today'], queryFn: () => api.get('/attendance/today').then(r => r.data), refetchInterval: 30000 })
  const { data: myAtt } = useQuery({ queryKey: ['my-attendance', month, year], queryFn: () => api.get('/attendance/my', { params: { month, year } }).then(r => r.data) })
  const { data: orgAtt } = useQuery({ queryKey: ['org-attendance'], queryFn: () => api.get('/attendance/org/today').then(r => r.data), refetchInterval: 30000 })

  const checkIn = useMutation({
    mutationFn: () => api.post('/attendance/checkin'),
    onSuccess: () => { toast.success('Checked in!'); qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['org-attendance']) },
    onError: err => toast.error(err.response?.data?.message || 'Error')
  })
  const checkOut = useMutation({
    mutationFn: () => api.post('/attendance/checkout'),
    onSuccess: () => { toast.success('Checked out!'); qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['my-attendance']) },
    onError: err => toast.error(err.response?.data?.message || 'Error')
  })

  const att = todayAtt?.attendance
  const hasCheckedIn = !!att?.checkIn
  const hasCheckedOut = !!att?.checkOut
  const workHours = att?.workingHours || 0

  const isManager = ['org_owner','hr_manager','team_lead'].includes(user?.role)
  const orgStats = orgAtt?.stats || {}

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500 text-sm">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Check In/Out Widget */}
      <div className="card gradient-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-slate-500 text-sm mb-1">Today's Status</p>
            <div className="flex items-center gap-2">
              {!hasCheckedIn && <span className="badge status-absent">Not Checked In</span>}
              {hasCheckedIn && !hasCheckedOut && <span className="badge status-present">Checked In {att?.isLate && '(Late)'}</span>}
              {hasCheckedOut && <span className="badge status-present">Completed — {workHours}h</span>}
            </div>
            {att?.checkIn && <p className="text-slate-400 text-xs mt-1">In: {format(new Date(att.checkIn), 'hh:mm a')}{att.checkOut && ` · Out: ${format(new Date(att.checkOut), 'hh:mm a')}`}</p>}
          </div>
          <div className="flex gap-3">
            {!hasCheckedIn && (
              <button onClick={() => checkIn.mutate()} disabled={checkIn.isPending} className="btn-primary">
                {checkIn.isPending ? <Loader size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Check In</>}
              </button>
            )}
            {hasCheckedIn && !hasCheckedOut && (
              <button onClick={() => checkOut.mutate()} disabled={checkOut.isPending} className="btn-secondary">
                {checkOut.isPending ? <Loader size={16} className="animate-spin" /> : <><XCircle size={16} /> Check Out</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manager Stats */}
      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Active', value: orgStats.total || 0, color: 'text-slate-900', icon: Clock },
            { label: 'Present', value: orgStats.present || 0, color: 'text-green-600', icon: CheckCircle },
            { label: 'Late', value: orgStats.late || 0, color: 'text-orange-500', icon: AlertCircle },
            { label: 'Absent', value: orgStats.absent || 0, color: 'text-red-500', icon: XCircle },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-slate-500 text-xs">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[['my','My History'],['org','Team Today']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab===v ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{l}</button>
        ))}
      </div>

      {tab === 'my' && (
        <>
          <div className="flex gap-3">
            <select className="input w-32 text-sm" value={month} onChange={e => setMonth(e.target.value)}>
              {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>)}
            </select>
            <select className="input w-28 text-sm" value={year} onChange={e => setYear(e.target.value)}>
              {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Check In</th>
                  <th className="text-left py-2">Check Out</th>
                  <th className="text-left py-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {(myAtt?.records || []).map(r => (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 text-slate-700">{r.date}</td>
                    <td className="py-2"><span className={`badge status-${r.status}`}>{r.status}</span></td>
                    <td className="py-2 text-slate-500">{r.checkIn ? format(new Date(r.checkIn),'hh:mm a') : '-'}</td>
                    <td className="py-2 text-slate-500">{r.checkOut ? format(new Date(r.checkOut),'hh:mm a') : '-'}</td>
                    <td className="py-2 text-slate-700">{r.workingHours ? `${r.workingHours}h` : '-'}</td>
                  </tr>
                ))}
                {!myAtt?.records?.length && (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400">No records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'org' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(orgAtt?.records || []).map(r => (
            <div key={r._id} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {r.employeeId?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-medium truncate">{r.employeeId?.name}</p>
                <p className="text-slate-400 text-xs">{r.checkIn ? format(new Date(r.checkIn),'hh:mm a') : 'N/A'}</p>
              </div>
              <span className={`badge status-${r.status}`}>{r.status}</span>
            </div>
          ))}
          {!orgAtt?.records?.length && (
            <div className="col-span-3 text-center py-10 text-slate-400">No attendance today</div>
          )}
        </div>
      )}
    </div>
  )
}