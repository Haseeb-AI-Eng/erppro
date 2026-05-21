import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Send, Loader, MessageSquare } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../services/socket'
import { format } from 'date-fns'

export default function Chat() {
  const { user } = useAuthStore()
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const { data: employees } = useQuery({ queryKey: ['employees-chat'], queryFn: () => api.get('/employees').then(r => r.data) })

  useEffect(() => {
    if (!selectedUser) return
    api.get(`/chat/dm/${selectedUser._id}`).then(r => setMessages(r.data.messages || []))
  }, [selectedUser])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = (msg) => {
      if (selectedUser && (msg.senderId?._id === selectedUser._id || msg.recipientId === selectedUser._id)) {
        setMessages(prev => [...prev, msg])
      }
    }
    socket.on('new_message', handler)
    return () => socket.off('new_message', handler)
  }, [selectedUser])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMsg = async (e) => {
    e.preventDefault()
    if (!text.trim() || !selectedUser) return
    setSending(true)
    try {
      const { data } = await api.post('/chat/send', { recipientId: selectedUser._id, message: text })
      setMessages(prev => [...prev, data.message])
      setText('')
    } catch {} finally { setSending(false) }
  }

  const others = (employees?.employees || []).filter(e => e._id !== user?.id)

  return (
    <div className="flex h-full gap-4 animate-fade-in" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Sidebar */}
      <div className="w-64 shrink-0 card overflow-y-auto">
        <p className="text-white font-semibold text-sm mb-3">Team Members</p>
        <div className="space-y-1">
          {others.map(emp => (
            <button key={emp._id} onClick={() => setSelectedUser(emp)} className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${selectedUser?._id === emp._id ? 'bg-primary-600/20 border border-primary-500/30' : 'hover:bg-dark-700'}`}>
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {emp.name?.charAt(0)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-800 ${emp.isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{emp.name}</p>
                <p className="text-gray-500 text-xs truncate">{emp.designation || emp.department}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            <div className="flex items-center gap-3 pb-3 border-b border-dark-400 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {selectedUser.name?.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{selectedUser.name}</p>
                <p className="text-gray-500 text-xs">{selectedUser.isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map((msg, i) => {
                const isMe = msg.senderId?._id === user?.id || msg.senderId === user?.id
                return (
                  <motion.div key={msg._id || i} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-dark-700 text-gray-200 rounded-bl-sm'}`}>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-500'}`}>{format(new Date(msg.createdAt || Date.now()), 'hh:mm a')}</p>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={bottomRef} />
              {!messages.length && <div className="text-center text-gray-500 text-sm mt-10">No messages yet. Say hi!</div>}
            </div>

            <form onSubmit={sendMsg} className="flex gap-2 mt-3 pt-3 border-t border-dark-400">
              <input className="input text-sm flex-1" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} />
              <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-3">
                {sending ? <Loader size={16} className="animate-spin"/> : <Send size={16}/>}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare size={40} className="mb-3 opacity-50" />
            <p>Select a team member to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
