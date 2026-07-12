import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const anthropicKey =
    env.VITE_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY || ''

  const githubPages = Boolean(process.env.GITHUB_PAGES)

  return {
    base: githubPages ? '/simon-system/' : '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (requestPath) =>
            requestPath.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (anthropicKey) {
                proxyReq.setHeader('x-api-key', anthropicKey)
              }
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            })
          },
        },
      },
    },
  }
})
