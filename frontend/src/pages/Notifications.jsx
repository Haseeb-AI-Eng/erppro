import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, Check, Trash2, CheckCheck, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { formatDistanceToNow } from 'date-fns'

const typeColors = { info: 'text-blue-400', success: 'text-green-400', warning: 'text-yellow-400', error: 'text-red-400', task: 'text-purple-400', attendance: 'text-cyan-400', payroll: 'text-emerald-400', leave: 'text-orange-400', ai: 'text-pink-400' }

export default function Notifications() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get('/notifications').then(r => r.data) })
  const notifications = data?.notifications || []

  const markRead = async (id) => { await api.put(`/notifications/${id}/read`); qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications-count']) }
  const markAllRead = async () => { await api.put('/notifications/read-all'); toast.success('All marked as read'); qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications-count']) }
  const del = async (id) => { await api.delete(`/notifications/${id}`); qc.invalidateQueries(['notifications']) }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Notifications</h1><p className="text-gray-400 text-sm">{data?.unreadCount || 0} unread</p></div>
        {data?.unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary"><CheckCheck size={14}/>Mark all read</button>}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary-400"/></div> : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n._id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}} className={`card flex items-start gap-3 transition-all ${!n.isRead ? 'border-primary-500/30 bg-primary-500/5' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-primary-500' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white text-sm font-medium">{n.title}</p>
                  <span className="text-gray-500 text-xs whitespace-nowrap">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs capitalize ${typeColors[n.type] || 'text-gray-400'}`}>{n.type}</span>
                  <span className="text-gray-600">·</span>
                  <span className={`text-xs ${n.priority === 'critical' ? 'text-red-400' : n.priority === 'important' ? 'text-orange-400' : 'text-gray-500'}`}>{n.priority}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.isRead && <button onClick={() => markRead(n._id)} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"><Check size={14}/></button>}
                <button onClick={() => del(n._id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={14}/></button>
              </div>
            </motion.div>
          ))}
          {!notifications.length && (
            <div className="text-center py-20">
              <Bell size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
