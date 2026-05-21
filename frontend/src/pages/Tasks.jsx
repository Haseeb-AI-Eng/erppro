import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Loader, X, Bot, MessageSquare, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'

const STATUSES = ['pending','in_progress','submitted','approved','rejected','completed']
const PRIORITIES = ['low','medium','high','critical']
const DEPARTMENTS = ['Engineering','Sales','HR','Finance','Marketing','Operations','Support','Product','Design']

function TaskModal({ task, onClose }) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isEdit = !!task?._id
  const [form, setForm] = useState(task || { title:'', description:'', priority:'medium', status:'pending', dueDate:'', department:'', tags:'' })
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [selEmp, setSelEmp] = useState(task?.assignedTo?.map(e=>e._id||e) || [])

  React.useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data.employees || []))
  }, [])

  const aiSuggest = async () => {
    if (!form.title) return toast.error('Enter a title first')
    setAiLoading(true)
    try {
      const { data } = await api.post('/ai/task-suggest', { context: form.title })
      setForm(f => ({ ...f, description: data.suggestion.description || f.description, priority: data.suggestion.priority || f.priority }))
      toast.success('AI filled the details!')
    } catch { toast.error('AI error') } finally { setAiLoading(false) }
  }

  const save = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form, assignedTo: selEmp, tags: typeof form.tags === 'string' ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : form.tags }
      if (isEdit) await api.put(`/tasks/${task._id}`, payload)
      else await api.post('/tasks', payload)
      toast.success(isEdit ? 'Task updated' : 'Task created')
      qc.invalidateQueries(['tasks']); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="glass rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 font-bold text-lg">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900"><X size={20}/></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1"><label className="text-xs text-slate-500 block mb-1">Title *</label><input className="input text-sm" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
            <button type="button" onClick={aiSuggest} disabled={aiLoading} className="mt-5 btn-secondary text-xs px-3 py-2 whitespace-nowrap">
              {aiLoading ? <Loader size={12} className="animate-spin"/> : <><Bot size={12}/>AI Fill</>}
            </button>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Description</label><textarea className="input text-sm resize-none" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Priority</label>
              <select className="input text-sm" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {PRIORITIES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-500 block mb-1">Status</label>
              <select className="input text-sm" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-500 block mb-1">Due Date</label><input className="input text-sm" type="date" value={form.dueDate?.split('T')[0]||''} onChange={e=>setForm({...form,dueDate:e.target.value})} /></div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Department</label>
              <select className="input text-sm" value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Assign To</label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-100 rounded-lg p-2">
              {employees.map(emp => (
                <label key={emp._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-200 rounded p-1">
                  <input type="checkbox" checked={selEmp.includes(emp._id)} onChange={e => setSelEmp(prev => e.target.checked ? [...prev, emp._id] : prev.filter(id=>id!==emp._id))} className="accent-primary-500" />
                  <span className="text-sm text-gray-300">{emp.name}</span>
                  <span className="text-xs text-slate-500">{emp.department}</span>
                </label>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Tags (comma separated)</label><input className="input text-sm" value={Array.isArray(form.tags)?form.tags.join(','):form.tags||''} onChange={e=>setForm({...form,tags:e.target.value})} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? <Loader size={14} className="animate-spin"/> : 'Save'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function Tasks() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState({ status:'', priority:'' })
  const [view, setView] = useState('list')
  const canManage = ['org_owner','hr_manager','team_lead'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => api.get('/tasks', { params: filter }).then(r => r.data)
  })

  const { data: kanban } = useQuery({
    queryKey: ['tasks-kanban'],
    queryFn: () => api.get('/tasks/meta/kanban').then(r => r.data),
    enabled: view === 'kanban'
  })

  const updateStatus = async (id, status) => {
    try { await api.put(`/tasks/${id}`, { status }); qc.invalidateQueries(['tasks']); qc.invalidateQueries(['tasks-kanban']); toast.success('Status updated') }
    catch { toast.error('Error') }
  }

  const tasks = data?.tasks || []

  return (
    <div className="space-y-5 animate-slide-up">
      {modal !== false && <TaskModal task={modal||null} onClose={() => setModal(false)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Tasks</h1><p className="text-slate-500 text-sm">{tasks.length} tasks</p></div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {[['list','List'],['kanban','Kanban']].map(([v,l]) => (
              <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view===v?'bg-primary-600 text-white':'text-slate-500 hover:text-slate-900'}`}>{l}</button>
            ))}
          </div>
          {canManage && <button onClick={()=>setModal(null)} className="btn-primary"><Plus size={16}/>New Task</button>}
        </div>
      </div>

      <div className="flex gap-3">
        <select className="input w-36 text-sm" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
          <option value="">All Status</option>
          {STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="input w-36 text-sm" value={filter.priority} onChange={e=>setFilter({...filter,priority:e.target.value})}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>

      {isLoading && view === 'list' && <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400"/></div>}

      {view === 'list' && !isLoading && (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <motion.div key={t._id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}} className="card hover:border-primary-500/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-900 font-medium text-sm">{t.title}</p>
                    <span className={`badge priority-${t.priority}`}>{t.priority}</span>
                    <span className={`badge status-${t.status}`}>{t.status?.replace('_',' ')}</span>
                  </div>
                  {t.description && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{t.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    {t.dueDate && <span>Due: {format(new Date(t.dueDate),'MMM d, yyyy')}</span>}
                    {t.assignedTo?.length > 0 && <span>{t.assignedTo.length} assignee{t.assignedTo.length > 1 ? 's' : ''}</span>}
                    {t.comments?.length > 0 && <span className="flex items-center gap-1"><MessageSquare size={11}/>{t.comments.length}</span>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setModal(t)} className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors">Edit</button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {!tasks.length && <div className="text-center py-16 text-slate-500">No tasks found</div>}
        </div>
      )}

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map(status => (
            <div key={status} className="shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge status-${status} text-xs`}>{status.replace('_',' ')}</span>
                <span className="text-slate-500 text-xs">{kanban?.board?.[status]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(kanban?.board?.[status] || []).map(t => (
                  <div key={t._id} className="card text-xs hover:border-primary-500/30 transition-all cursor-pointer" onClick={() => setModal(t)}>
                    <p className="text-slate-900 font-medium mb-1">{t.title}</p>
                    <span className={`badge priority-${t.priority}`}>{t.priority}</span>
                    {t.dueDate && <p className="text-slate-500 mt-1">Due: {format(new Date(t.dueDate),'MMM d')}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
