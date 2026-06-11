import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// A representative dashboard so the Verify & Publish output preview renders in
// mock mode (the real /api/sessions/:id/files/:path is served by the backend).
const SAMPLE_DASHBOARD_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f6f7fb;color:#1f2333;padding:20px}
  .hero{background:linear-gradient(135deg,#1e2746,#2b3566);color:#fff;border-radius:16px;padding:24px;border-left:5px solid #ef4444}
  .hero h1{margin:0 0 6px;font-size:24px}.hero p{margin:0;opacity:.8;font-size:13px}
  .pill{display:inline-flex;align-items:center;gap:6px;background:#fde2e1;color:#b91c1c;font-weight:600;font-size:12px;padding:4px 10px;border-radius:999px;margin-top:12px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:16px}
  .card{background:#fff;border:1px solid #e7e9f2;border-radius:12px;padding:16px}
  .card .label{font-size:11px;letter-spacing:.04em;color:#8e93af;text-transform:uppercase}
  .card .value{font-size:26px;font-weight:700;margin:6px 0 2px}.card .sub{font-size:12px;color:#8e93af}
  .red{color:#ef4444}
</style></head><body>
  <div class="hero">
    <h1>Pipeline Pacing Gap</h1>
    <p>Q2 FY27 · day 42 of 92 · 50 days remaining · as-of Jun 11, 2026 (data freshness)</p>
    <span class="pill">⚠ Behind Pace</span>
  </div>
  <div class="grid">
    <div class="card"><div class="label">Target</div><div class="value">$1.00M</div><div class="sub">USD</div></div>
    <div class="card"><div class="label">QTD Pipeline</div><div class="value">$0</div><div class="sub">marketing-sourced</div></div>
    <div class="card"><div class="label">Required to Date</div><div class="value">$457K</div><div class="sub">straight-line pace</div></div>
    <div class="card"><div class="label">Pacing Attainment</div><div class="value red">0.0%</div><div class="sub">floor 85%</div></div>
    <div class="card"><div class="label">Projected EOQ</div><div class="value">$0</div><div class="sub">linear extrapolation</div></div>
    <div class="card"><div class="label">EOQ Gap</div><div class="value red">$1.00M</div><div class="sub">vs target</div></div>
  </div>
</body></html>`

// Dev-only middleware: serve the sample dashboard for file-preview requests in
// mock mode so the iframe isn't blank (no real backend running).
const mockDashboardFilesPlugin = {
  name: 'mock-dashboard-files',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.method === 'GET' && /^\/api\/sessions\/[^/]+\/files\/.+\.html(\?|$)/.test(req.url || '')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(SAMPLE_DASHBOARD_HTML)
        return
      }
      next()
    })
  },
}

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

  // Mock-only app: default ON in every build (set VITE_MOCK=false to opt out).
  const mockEnabled = env.VITE_MOCK !== 'false'
  if (mockEnabled) plugins.push(mockDashboardFilesPlugin)

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
