import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { DollarSign, Play, CheckCircle, Loader, Bot, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Payroll() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [generating, setGenerating] = useState(false)
  const [aiInsight, setAiInsight] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [editPayroll, setEditPayroll] = useState(null)
  const canManage = ['org_owner','hr_manager'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: () => api.get('/payroll', { params: { month, year } }).then(r => r.data)
  })

  const generatePayroll = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post('/payroll/generate', { month: parseInt(month), year: parseInt(year) })
      toast.success(`Generated ${data.generated} payroll records`)
      qc.invalidateQueries(['payroll'])
    } catch (err) { toast.error(err.response?.data?.message || 'Error') } finally { setGenerating(false) }
  }

  const updateStatus = async (id, status) => {
    try { await api.put(`/payroll/${id}/status`, { status }); toast.success(`Payroll ${status}`); qc.invalidateQueries(['payroll']) }
    catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const getAiInsight = async () => {
    setAiLoading(true)
    try { const { data } = await api.post('/ai/payroll-insight', { month: parseInt(month), year: parseInt(year) }); setAiInsight(data.insight) }
    catch { toast.error('AI error') } finally { setAiLoading(false) }
  }

  const payrolls = data?.payrolls || []
  const totalNet = payrolls.reduce((s,p) => s + p.netSalary, 0)
  const paidCount = payrolls.filter(p => p.status === 'paid').length

  return (
    <div className="space-y-5 animate-slide-up">
      {editPayroll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="glass rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">Edit Payroll</h2>
              <button onClick={()=>setEditPayroll(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              {[['bonus','Bonus ($)'],['deductions','Deductions ($)'],['notes','Notes']].map(([k,l]) => (
                <div key={k}><label className="text-xs text-gray-400 block mb-1">{l}</label>
                  <input className="input text-sm" type={k==='notes'?'text':'number'} value={editPayroll[k]||''} onChange={e=>setEditPayroll({...editPayroll,[k]:e.target.value})} />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setEditPayroll(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={async()=>{try{await api.put(`/payroll/${editPayroll._id}`,editPayroll);toast.success('Updated');qc.invalidateQueries(['payroll']);setEditPayroll(null)}catch{toast.error('Error')}}} className="btn-primary flex-1 justify-center">Save</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Payroll</h1><p className="text-gray-400 text-sm">{paidCount}/{payrolls.length} paid · Total: ${totalNet.toLocaleString()}</p></div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={getAiInsight} disabled={aiLoading} className="btn-secondary">
              {aiLoading ? <Loader size={14} className="animate-spin"/> : <><Bot size={14}/>AI Insight</>}
            </button>
            <button onClick={generatePayroll} disabled={generating} className="btn-primary">
              {generating ? <Loader size={14} className="animate-spin"/> : <><Play size={14}/>Generate</>}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <select className="input w-36 text-sm" value={month} onChange={e=>setMonth(e.target.value)}>
          {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>)}
        </select>
        <select className="input w-24 text-sm" value={year} onChange={e=>setYear(e.target.value)}>
          {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
        </select>
      </div>

      {aiInsight && (
        <div className="card bg-primary-600/10 border-primary-500/30">
          <div className="flex items-center gap-2 mb-2"><Bot size={16} className="text-primary-400"/><span className="text-primary-400 font-semibold text-sm">AI Payroll Insight</span></div>
          <p className="text-gray-300 text-sm">{aiInsight}</p>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400"/></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-dark-400 text-gray-400 text-xs">
              <th className="text-left py-2 px-2">Employee</th>
              <th className="text-left py-2 px-2">Basic</th>
              <th className="text-left py-2 px-2">Overtime</th>
              <th className="text-left py-2 px-2">Bonus</th>
              <th className="text-left py-2 px-2">Deductions</th>
              <th className="text-left py-2 px-2">Tax</th>
              <th className="text-left py-2 px-2 text-white">Net</th>
              <th className="text-left py-2 px-2">Status</th>
              {canManage && <th className="text-left py-2 px-2">Actions</th>}
            </tr></thead>
            <tbody>
              {payrolls.map(p => (
                <tr key={p._id} className="border-b border-dark-400/50 hover:bg-dark-700/30">
                  <td className="py-2 px-2">
                    <p className="text-white font-medium">{p.employeeId?.name}</p>
                    <p className="text-gray-500 text-xs">{p.employeeId?.department}</p>
                  </td>
                  <td className="py-2 px-2 text-gray-300">${p.basicSalary?.toLocaleString()}</td>
                  <td className="py-2 px-2 text-green-400">+${p.overtimePay}</td>
                  <td className="py-2 px-2 text-green-400">+${p.bonus}</td>
                  <td className="py-2 px-2 text-red-400">-${p.deductions}</td>
                  <td className="py-2 px-2 text-red-400">-${p.tax}</td>
                  <td className="py-2 px-2 text-white font-bold">${p.netSalary?.toLocaleString()}</td>
                  <td className="py-2 px-2"><span className={`badge ${p.status==='paid'?'status-present':p.status==='pending'?'status-pending':'status-in_progress'}`}>{p.status}</span></td>
                  {canManage && (
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        {p.status === 'pending' && <button onClick={()=>updateStatus(p._id,'paid')} className="text-xs btn-primary py-1 px-2"><CheckCircle size={12}/>Pay</button>}
                        <button onClick={()=>setEditPayroll(p)} className="text-xs btn-secondary py-1 px-2">Edit</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!payrolls.length && <tr><td colSpan={9} className="py-10 text-center text-gray-500">No payroll records. Click Generate to create.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
