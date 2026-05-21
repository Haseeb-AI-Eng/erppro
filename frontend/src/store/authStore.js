import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      updateUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),
      logout: () => set({ user: null, token: null, refreshToken: null }),
    }),
    { name: 'erp-auth' }
  )
)
