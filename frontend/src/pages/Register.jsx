import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ name: '', ownerName: '', email: '', password: '', industry: 'Technology', size: '1-10', phone: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Real Estate', 'Media', 'Consulting', 'Other']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/org/register', form)
      setAuth(data.user, data.token, data.refreshToken)
      toast.success('Organization registered successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/25">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ShineERP Registration</h1>
          <p className="text-slate-500 mt-1 text-sm">Start your AI-powered ERP journey</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Organization Name *</label>
                <input className="input" placeholder="Acme Corp" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Owner Name *</label>
                <input className="input" placeholder="John Doe" required value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Business Email *</label>
              <input className="input" type="email" placeholder="admin@company.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Password *</label>
              <input className="input" type="password" placeholder="••••••••" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Industry</label>
                <select className="input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                  {industries.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Company Size</label>
                <select className="input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                  {['1-10','11-50','51-200','201-500','500+'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <Loader size={16} className="animate-spin" /> : 'Create Organization'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-4">
            Already registered? <Link to="/login?mode=org_owner" className="text-primary-400 hover:text-primary-300">Sign in as Owner</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
