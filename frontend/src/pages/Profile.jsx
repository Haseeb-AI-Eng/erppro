import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Building, Save, Loader, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name||'', phone: user?.phone||'', bio: user?.bio||'', skills: user?.skills?.join(', ')||'' })
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await api.put('/employees/profile/me', { ...form, skills: form.skills.split(',').map(s=>s.trim()).filter(Boolean) })
      updateUser(data.employee)
      toast.success('Profile updated')
    } catch (err) { toast.error(err.response?.data?.message || 'Error') } finally { setSaving(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match')
    setPwSaving(true)
    try {
      await api.put('/employees/profile/me', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed'); setPwForm({ currentPassword:'', newPassword:'', confirm:'' })
    } catch (err) { toast.error(err.response?.data?.message || 'Error') } finally { setPwSaving(false) }
  }

  return (
    <div className="space-y-5 animate-slide-up max-w-2xl">
      <h1 className="text-2xl font-bold text-white">My Profile</h1>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{user?.name}</h2>
            <p className="text-gray-400 text-sm capitalize">{user?.role?.replace('_',' ')}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Building size={12}/><span>{user?.organization?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Full Name</label><input className="input text-sm" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Phone</label><input className="input text-sm" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
          </div>
          <div><label className="text-xs text-gray-400 block mb-1">Skills (comma separated)</label><input className="input text-sm" value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})} /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Bio</label><textarea className="input text-sm resize-none" rows={3} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} /></div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader size={14} className="animate-spin"/> : <><Save size={14}/>Save Profile</>}
          </button>
        </form>
      </div>

      {/* Info Card */}
      <div className="card space-y-2">
        <h3 className="text-white font-semibold mb-3">Account Info</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400"><Mail size={14}/>{user?.email}</div>
        {user?.organization?.code && <div className="flex items-center gap-2 text-sm text-gray-400"><Building size={14}/>Company Code: <span className="text-primary-400 font-mono">{user?.organization?.code}</span></div>}
        <div className="flex items-center gap-2 text-sm text-gray-400"><User size={14}/>Employee ID: {user?.employeeId || 'N/A'}</div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Key size={16}/>Change Password</h3>
        <form onSubmit={changePassword} className="space-y-3">
          <div><label className="text-xs text-gray-400 block mb-1">Current Password</label><input className="input text-sm" type="password" required value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} /></div>
          <div><label className="text-xs text-gray-400 block mb-1">New Password</label><input className="input text-sm" type="password" required value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Confirm Password</label><input className="input text-sm" type="password" required value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} /></div>
          <button type="submit" disabled={pwSaving} className="btn-primary">
            {pwSaving ? <Loader size={14} className="animate-spin"/> : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
