import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', loginType: 'employee' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const mode = params.get('mode')
    if (mode === 'org_owner' || mode === 'employee' || mode === 'super_admin') {
      setForm(prev => ({ ...prev, loginType: mode }))
    }
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = form.loginType === 'super_admin' ? '/auth/super-admin/login' : '/auth/login'
      const payload = { email: form.email, password: form.password }
      const { data } = await api.post(endpoint, payload)
      setAuth(data.user, data.token, data.refreshToken)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate(data.user.role === 'employee' ? '/attendance' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/25">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ShineERP</h1>
          <p className="text-slate-500 mt-1 text-sm">AI-powered enterprise platform</p>
        </div>

        <div className="glass rounded-2xl p-6">
          {/* Login Type Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            {[
              { v: 'employee', l: 'Employee' },
              { v: 'org_owner', l: 'Organization' },
              { v: 'super_admin', l: 'Super Admin' }
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setForm({ ...form, loginType: v })}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${form.loginType === v ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.loginType === 'employee' && (
              <div>
                <label className="block text-sm text-slate-500 mb-1">OTP</label>
                <input className="input" placeholder="Enter OTP from email" required type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div>
                <label className="block text-sm text-slate-500 mb-1">Email</label>
              <input className="input" type="email" placeholder="your@email.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            {form.loginType !== 'employee' && (
              <div>
                <label className="block text-sm text-slate-500 mb-1">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <Loader size={16} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {form.loginType !== 'super_admin' && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-slate-500 text-sm mb-4">
                {form.loginType === 'org_owner' ? "Don't have an organization yet?" : "Need to register a company?"}
              </p>
              <Link to="/register" className="btn-secondary w-full justify-center py-2.5 text-sm">
                Register New Organization
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
