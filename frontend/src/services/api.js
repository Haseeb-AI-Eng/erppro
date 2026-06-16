import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, { refreshToken })
          useAuthStore.getState().setAuth(useAuthStore.getState().user, data.token, refreshToken)
          err.config.headers.Authorization = `Bearer ${data.token}`
          return api(err.config)
        } catch { useAuthStore.getState().logout() }
      }
    }
    return Promise.reject(err)
  }
)

export default api
