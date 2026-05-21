import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Mail, Phone, X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const ROLES = ['employee','team_lead','hr_manager','org_owner']
const DEPARTMENTS = ['Engineering','Sales','HR','Finance','Marketing','Operations','Support','Product','Design']

function EmployeeModal({ employee, onClose, orgId }) {
  const qc = useQueryClient()
  const isEdit = !!employee?._id
  const [form, setForm] = useState(employee || { name:'', email:'', department:'', designation:'', role:'employee', salary:0, phone:'' })
  const [loading, setLoading] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) await api.put(`/employees/${employee._id}`, form)
      else await api.post('/employees', form)
      toast.success(isEdit ? 'Employee updated' : 'Employee added')
      qc.invalidateQueries(['employees'])
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 font-bold text-lg">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900"><X size={20} /></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Full Name *</label><input className="input text-sm" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Email *</label><input className="input text-sm" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Department</label>
              <select className="input text-sm" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-500 block mb-1">Designation</label><input className="input text-sm" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Role</label>
              <select className="input text-sm" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-500 block mb-1">Salary ($)</label><input className="input text-sm" type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Phone</label><input className="input text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            {!isEdit && <div><label className="text-xs text-slate-500 block mb-1">Password</label><input className="input text-sm" type="password" placeholder="Auto-generated if empty" value={form.password||''} onChange={e => setForm({...form, password: e.target.value})} /></div>}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? <Loader size={14} className="animate-spin" /> : 'Save'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function Employees() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [modal, setModal] = useState(null)
  const qc = useQueryClient()
  const canManage = ['org_owner','hr_manager'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, dept],
    queryFn: () => api.get('/employees', { params: { search, department: dept } }).then(r => r.data)
  })

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/employees/meta/departments').then(r => r.data) })

  const deleteEmp = async (id) => {
    if (!confirm('Remove this employee?')) return
    try { await api.delete(`/employees/${id}`); toast.success('Removed'); qc.invalidateQueries(['employees']) }
    catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const employees = data?.employees || []

  return (
    <div className="space-y-5 animate-slide-up">
      {modal !== undefined && modal !== false && <EmployeeModal employee={modal || null} onClose={() => setModal(false)} />}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Employees</h1><p className="text-slate-500 text-sm">{employees.length} total</p></div>
        {canManage && <button onClick={() => setModal(null)} className="btn-primary"><Plus size={16} />Add Employee</button>}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9 text-sm" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40 text-sm" value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {deptData?.departments?.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp, i) => (
            <motion.div key={emp._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card hover:border-primary-500/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-200 ${emp.isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-semibold text-sm truncate">{emp.name}</p>
                  <p className="text-slate-500 text-xs truncate">{emp.designation || emp.department || 'Employee'}</p>
                  <span className="badge mt-1 bg-primary-500/20 text-primary-400 capitalize">{emp.role?.replace('_',' ')}</span>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => setModal(emp)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><Edit size={14} /></button>
                    <button onClick={() => deleteEmp(emp._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={12} /><span className="truncate">{emp.email}</span></div>
                {emp.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} />{emp.phone}</div>}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">{emp.employeeId}</span>
                <span className={`badge ${emp.status === 'active' ? 'status-present' : 'status-absent'}`}>{emp.status}</span>
              </div>
            </motion.div>
          ))}
          {!employees.length && <div className="col-span-3 text-center py-16 text-slate-500">No employees found</div>}
        </div>
      )}
    </div>
  )
}
