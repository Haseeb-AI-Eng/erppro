import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, X, Loader, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'

const TYPES = ['casual','sick','annual','unpaid','maternity','paternity']

function LeaveModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ type:'casual', startDate:'', endDate:'', reason:'' })
  const [loading, setLoading] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await api.post('/leaves', form); toast.success('Leave applied'); qc.invalidateQueries(['leaves']); onClose() }
    catch (err) { toast.error(err.response?.data?.message || 'Error') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Apply Leave</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div><label className="text-xs text-gray-400 block mb-1">Leave Type</label>
            <select className="input text-sm" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              {TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Start Date</label><input className="input text-sm" type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">End Date</label><input className="input text-sm" type="date" required value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} /></div>
          </div>
          <div><label className="text-xs text-gray-400 block mb-1">Reason *</label><textarea className="input text-sm resize-none" rows={3} required value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? <Loader size={14} className="animate-spin"/> : 'Apply'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function Leaves() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('')
  const canManage = ['org_owner','hr_manager','team_lead'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', filter],
    queryFn: () => api.get('/leaves', { params: { status: filter } }).then(r => r.data)
  })

  const updateStatus = async (id, status, reason) => {
    try { await api.put(`/leaves/${id}/status`, { status, rejectionReason: reason }); toast.success(`Leave ${status}`); qc.invalidateQueries(['leaves']) }
    catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const leaves = data?.leaves || []

  return (
    <div className="space-y-5 animate-slide-up">
      {showModal && <LeaveModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Leaves</h1><p className="text-gray-400 text-sm">{leaves.length} records</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16}/>Apply Leave</button>
      </div>

      <div className="flex gap-1 bg-dark-800 rounded-lg p-1 w-fit">
        {[['','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter===v?'bg-primary-600 text-white':'text-gray-400 hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400"/></div> : (
        <div className="space-y-3">
          {leaves.map((leave, i) => (
            <motion.div key={leave._id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="card hover:border-primary-500/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {canManage && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {leave.employeeId?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    {canManage && <p className="text-white font-semibold text-sm">{leave.employeeId?.name}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-purple-500/20 text-purple-400 capitalize">{leave.type}</span>
                      <span className={`badge status-${leave.status}`}>{leave.status}</span>
                      <span className="text-gray-400 text-xs">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{format(new Date(leave.startDate),'MMM d')} — {format(new Date(leave.endDate),'MMM d, yyyy')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{leave.reason}</p>
                  </div>
                </div>
                {canManage && leave.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => updateStatus(leave._id, 'approved')} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors">
                      <CheckCircle size={12}/>Approve
                    </button>
                    <button onClick={() => updateStatus(leave._id, 'rejected', 'Rejected by manager')} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors">
                      <XCircle size={12}/>Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {!leaves.length && <div className="text-center py-16 text-gray-500">No leave records</div>}
        </div>
      )}
    </div>
  )
}
