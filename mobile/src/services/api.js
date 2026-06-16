import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const API_BASE = (Constants?.manifest?.extra?.apiUrl) || (process.env.API_URL) || 'http://localhost:5000'

const api = axios.create({ baseURL: `${API_BASE}/api` })

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch (e) { /* ignore */ }
  return config
}, (err) => Promise.reject(err))

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken')
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken })
          await SecureStore.setItemAsync('token', data.token)
          err.config.headers.Authorization = `Bearer ${data.token}`
          return api(err.config)
        }
      } catch (e) {
        await SecureStore.deleteItemAsync('token')
        await SecureStore.deleteItemAsync('refreshToken')
      }
    }
    return Promise.reject(err)
  }
)

export default api
