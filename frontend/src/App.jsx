import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { connectSocket, disconnectSocket } from './services/socket'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Tasks from './pages/Tasks'
import Payroll from './pages/Payroll'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Leaves from './pages/Leaves'
import Analytics from './pages/Analytics'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrganizations from './pages/admin/AdminOrganizations'
import AIAssistant from './pages/AIAssistant'
import MarketPrices from './pages/MarketPrices'
import ReceiptScanner from './pages/ReceiptScanner'

const getHomeRoute = (user) => {
  if (!user) return '/login'
  return user.role === 'employee' ? '/attendance' : '/dashboard'
}

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={getHomeRoute(user)} replace />
  return children
}

export default function App() {
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (token) connectSocket()
    return () => disconnectSocket()
  }, [token])

  return (
    // ✅ Both v7 future flags added — silences console warnings
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!token ? <Login /> : <Navigate to={getHomeRoute(user)} replace />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to={getHomeRoute(user)} replace />} />
        <Route path="/" element={<Navigate to={token ? getHomeRoute(user) : '/login'} replace />} />

        {/* Protected layout routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="tasks" element={<Tasks />} />
          <Route
            path="payroll"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <Payroll />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead', 'employee']}>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaves"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <Leaves />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="ai-assistant"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="market-prices"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <MarketPrices />
              </ProtectedRoute>
            }
          />
          <Route
            path="receipt-scanner"
            element={
              <ProtectedRoute roles={['org_owner', 'hr_manager', 'team_lead']}>
                <ReceiptScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/organizations"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminOrganizations />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}