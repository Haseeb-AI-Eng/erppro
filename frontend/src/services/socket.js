import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

let socket = null

export const connectSocket = () => {
  const token = useAuthStore.getState().token
  if (!token || socket?.connected) return socket
  socket = io(import.meta.env.VITE_API_URL || window.location.origin, { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null }
}

export const getSocket = () => socket
