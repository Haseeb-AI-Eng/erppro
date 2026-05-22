import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Building2, Users, CheckCircle, XCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatDistanceToNow } from 'date-fns'

export default function AdminOrganizations() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orgs', search, statusFilter],
    queryFn: () => api.get('/admin/organizations', { params: { search, status: statusFilter } }).then(r => r.data)
  })

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/organizations/${id}/status`, { status })
      toast.success(`Organization ${status}`)
      qc.invalidateQueries(['admin-orgs'])
      qc.invalidateQueries(['admin-stats'])
    } catch { toast.error('Error updating status') }
  }

  const orgs = data?.organizations || []

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        <p className="text-gray-400 text-sm">{orgs.length} organizations on the platform</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input className="input pl-9 text-sm" placeholder="Search organizations..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
          {[['','All'],['active','Active'],['pending','Pending'],['suspended','Suspended']].map(([v,l]) => (
            <button key={v} onClick={()=>setStatusFilter(v)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter===v?'bg-primary-600 text-white':'text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgs.map((org, i) => (
            <motion.div key={org._id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="card hover:border-primary-500/30 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                  {org.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{org.name}</p>
                  <p className="text-gray-400 text-xs">{org.industry} · {org.size}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${org.status==='active'?'status-present':org.status==='pending'?'status-pending':'status-rejected'}`}>{org.status}</span>
                    <span className="text-gray-500 text-xs font-mono">{org.code}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-dark-400 pt-3 mb-3">
                <div className="flex items-center gap-1.5 text-gray-400"><Users size={12}/>{org.employeeCount || 0} employees</div>
                <div className="flex items-center gap-1.5 text-gray-400"><Building2 size={12}/>{org.plan} plan</div>
              </div>
              <p className="text-gray-500 text-xs mb-3">{formatDistanceToNow(new Date(org.createdAt), {addSuffix:true})}</p>

              <div className="flex gap-2">
                {org.status !== 'active' && (
                  <button onClick={() => updateStatus(org._id, 'active')} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors">
                    <CheckCircle size={12}/>Activate
                  </button>
                )}
                {org.status !== 'suspended' && (
                  <button onClick={() => updateStatus(org._id, 'suspended')} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors">
                    <XCircle size={12}/>Suspend
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {!orgs.length && <div className="col-span-3 text-center py-16 text-gray-500">No organizations found</div>}
        </div>
      )}
    </div>
  )
}
