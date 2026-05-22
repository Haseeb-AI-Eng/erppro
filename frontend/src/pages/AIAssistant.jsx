import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Loader, Zap, User, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const QUICK_PROMPTS = [
  'Summarize today\'s attendance',
  'Show me pending tasks overview',
  'Generate a payroll summary',
  'What are the overdue tasks?',
  'Draft an HR announcement',
  'Suggest employee performance tips',
]

export default function AIAssistant() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([{ role: 'assistant', content: `Hello ${user?.name}! I'm your AI ERP assistant powered by Groq. I can help you with tasks, attendance analytics, payroll insights, HR queries, and much more. What would you like to know?` }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const { data } = await api.post('/ai/chat', { messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      toast.error('AI error')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bot size={24} className="text-primary-400"/>AI Assistant</h1>
        <p className="text-gray-400 text-sm">Powered by Groq — Ask anything about your organization</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={14} className="text-white"/>
              </div>
            )}
            <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-dark-700 text-gray-200 rounded-bl-sm border border-dark-400'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-white"/>
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white"/>
            </div>
            <div className="bg-dark-700 border border-dark-400 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader size={14} className="animate-spin text-primary-400"/>
              <span className="text-gray-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)} className="text-xs px-3 py-1.5 bg-dark-700 border border-dark-400 hover:border-primary-500/50 text-gray-400 hover:text-white rounded-lg transition-all">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="Ask me anything about your organization..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">
          {loading ? <Loader size={16} className="animate-spin"/> : <Send size={16}/>}
        </button>
      </form>
    </div>
  )
}
