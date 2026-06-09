import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const plugins = [react(), tailwindcss()]
  const sentryEnabled = env.VITE_SENTRY_ORG && env.VITE_SENTRY_PROJECT && env.VITE_SENTRY_AUTH_TOKEN

  if (sentryEnabled) {
    plugins.push(
      sentryVitePlugin({
        org: env.VITE_SENTRY_ORG,
        project: env.VITE_SENTRY_PROJECT,
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          filesToDeleteAfterUpload: ['dist/assets/*.map'],
        },
      })
    )
  }

  const mockEnabled = env.VITE_MOCK === 'true'

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Frontend-only mode: replace pusher-js with a no-op mock client so
        // every `new Pusher(...)` runs without a real websocket/backend.
        ...(mockEnabled
          ? { 'pusher-js': path.resolve(__dirname, './src/mocks/pusherBus.js') }
          : {}),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': 'http://localhost:8000',
      },
      historyApiFallback: true,
    },
    build: {
      sourcemap: sentryEnabled,
    },
  }
})
