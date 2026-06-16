import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
  updateUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),
  logout: () => set({ user: null, token: null, refreshToken: null })
}))
