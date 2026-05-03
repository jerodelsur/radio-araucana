import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Reproduce los rewrites de Vercel en el dev server, así las URLs públicas
// (/frontera/extractos, /frontera/extractos/admin, etc.) cargan el bundle
// correcto durante desarrollo y la BrowserRouter con basename funciona igual
// que en producción.
const devRewrites = () => ({
  name: 'extractos-dev-rewrites',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? ''
      if (url === '/frontera/extractos' || url.startsWith('/frontera/extractos/') || url.startsWith('/frontera/extractos?')) {
        // Preservar querystring si la hubiese.
        const qIdx = url.indexOf('?')
        req.url = qIdx >= 0 ? `/extractos.html${url.slice(qIdx)}` : '/extractos.html'
      }
      next()
    })
  },
})

// En dev `vite` no ejecuta las funciones serverless de /api. Para que el flujo
// del cotizador se pueda probar localmente sin levantar `vercel dev`, este
// stub responde igual que el endpoint real cuando Supabase no está configurado:
// 503 con el mensaje de fallback.
const devApiStub = () => ({
  name: 'extractos-dev-api-stub',
  configureServer(server) {
    server.middlewares.use('/api/extractos/orders', (req, res, next) => {
      if (req.method !== 'POST') return next()
      const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
      if (hasSupabase) {
        // Hay credenciales: dejamos que el cliente sepa que en dev igual
        // necesita `vercel dev` para ejecutar el endpoint real.
        res.statusCode = 501
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({
          error: 'dev_requires_vercel_dev',
          message: 'En desarrollo local con Supabase configurado, ejecuta `vercel dev` para que las funciones serverless corran.',
        }))
        return
      }
      res.statusCode = 503
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({
        error: 'system_not_configured',
        message: 'Estamos terminando de configurar el sistema. Por ahora envía tu extracto a secretaria.araucana@gmail.com y te respondemos con la cotización en el día.',
      }))
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), devRewrites(), devApiStub()],
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        frontera: resolve(__dirname, 'frontera.html'),
        extractos: resolve(__dirname, 'extractos.html'),
      },
    },
  },
})
