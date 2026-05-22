import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return defineConfig({
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://5000-inykseoisoya647edxdt1-277f91a1.us3.manus.computer',
          changeOrigin: true,
          secure: false
        }
      }
    }
  })
}
