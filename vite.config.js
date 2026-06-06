import { defineConfig, loadEnv } from 'vite'
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
      } else if (url === '/cotiza' || url.startsWith('/cotiza/') || url.startsWith('/cotiza?')) {
        const qIdx = url.indexOf('?')
        req.url = qIdx >= 0 ? `/cotiza.html${url.slice(qIdx)}` : '/cotiza.html'
      } else if (url === '/contacto' || url.startsWith('/contacto?')) {
        const qIdx = url.indexOf('?')
        req.url = qIdx >= 0 ? `/contacto.html${url.slice(qIdx)}` : '/contacto.html'
      } else if (url === '/socios-rds' || url.startsWith('/socios-rds/') || url.startsWith('/socios-rds?')) {
        const qIdx = url.indexOf('?')
        req.url = qIdx >= 0 ? `/socios.html${url.slice(qIdx)}` : '/socios.html'
      }
      next()
    })
  },
})

// En dev `vite` no ejecuta las funciones serverless de /api. Este middleware
// adapta los handlers de /api/extractos/* al sistema Connect/Vite para que el
// flujo del cotizador se pueda probar localmente con `npm run dev` (siempre y
// cuando .env.local tenga las credenciales). Si Supabase no está configurado,
// responde 503 con el mensaje de fallback.
const devApiStub = () => ({
  name: 'extractos-dev-api',
  async configureServer(server) {
    const handlers = new Map()

    async function loadHandler(modulePath) {
      if (handlers.has(modulePath)) return handlers.get(modulePath)
      const mod = await server.ssrLoadModule(modulePath)
      handlers.set(modulePath, mod.default)
      return mod.default
    }

    function readBody(req) {
      return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => { data += chunk })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })
    }

    function adapt(res) {
      return new Proxy(res, {
        get(target, prop) {
          if (prop === 'status') return (code) => { target.statusCode = code; return adapt(target) }
          if (prop === 'json') return (body) => {
            target.setHeader('content-type', 'application/json; charset=utf-8')
            target.end(JSON.stringify(body))
          }
          if (prop === 'send') return (body) => target.end(body)
          return target[prop] && target[prop].bind ? target[prop].bind(target) : target[prop]
        },
      })
    }

    async function runHandler(modulePath, req, res) {
      try {
        const handler = await loadHandler(modulePath)
        if (typeof handler !== 'function') {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'no_handler', message: `No default export en ${modulePath}` }))
          return
        }
        const raw = await readBody(req)
        try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
        await handler(req, adapt(res))
      } catch (err) {
        console.error('[dev-api]', err)
        res.statusCode = 500
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ error: 'internal_error', message: err?.message ?? 'error interno' }))
      }
    }

    server.middlewares.use('/api/extractos/orders', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/extractos/orders.js', req, res)
    })

    server.middlewares.use('/api/extractos/admin/notify-client', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/extractos/admin/notify-client.js', req, res)
    })

    server.middlewares.use('/api/cotiza/tarifas', async (req, res, next) => {
      if (req.method !== 'GET') return next()
      await runHandler('/api/cotiza/_handlers/tarifas.js', req, res)
    })

    server.middlewares.use('/api/cotiza/save-tarifas', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/save-tarifas.js', req, res)
    })

    server.middlewares.use('/api/cotiza/submit', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/submit.js', req, res)
    })

    server.middlewares.use('/api/cotiza/enviar-cliente', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/enviar-cliente.js', req, res)
    })

    server.middlewares.use('/api/cotiza/solicitudes', async (req, res, next) => {
      if (req.method !== 'GET') return next()
      await runHandler('/api/cotiza/_handlers/solicitudes.js', req, res)
    })

    server.middlewares.use('/api/cotiza/atender-solicitud', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/atender-solicitud.js', req, res)
    })

    server.middlewares.use('/api/cotiza/eliminar-solicitud', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/eliminar-solicitud.js', req, res)
    })

    server.middlewares.use('/api/cotiza/guardar-cotizacion', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/guardar-cotizacion.js', req, res)
    })

    server.middlewares.use('/api/cotiza/cotizaciones', async (req, res, next) => {
      if (req.method !== 'GET') return next()
      await runHandler('/api/cotiza/_handlers/cotizaciones.js', req, res)
    })

    server.middlewares.use('/api/cotiza/cotizacion-estado', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/cotizacion-estado.js', req, res)
    })

    server.middlewares.use('/api/cotiza/eliminar-cotizacion', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/eliminar-cotizacion.js', req, res)
    })

    server.middlewares.use('/api/cotiza/login', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/cotiza/_handlers/login.js', req, res)
    })

    server.middlewares.use('/api/contacto/submit', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      await runHandler('/api/contacto/submit.js', req, res)
    })
  },
})

export default defineConfig(({ mode }) => {
  // Cargar TODAS las env vars de .env / .env.local (no solo VITE_*) y volcarlas
  // en process.env. Esto permite que los handlers serverless ejecutados por el
  // dev middleware vean SUPABASE_URL y SUPABASE_SECRET_KEY.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }
  return {
    plugins: [react(), tailwindcss(), devRewrites(), devApiStub()],
    server: { port: Number(process.env.PORT) || 5173 },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          frontera: resolve(__dirname, 'frontera.html'),
          extractos: resolve(__dirname, 'extractos.html'),
          cotiza: resolve(__dirname, 'cotiza.html'),
          contacto: resolve(__dirname, 'contacto.html'),
          socios: resolve(__dirname, 'socios.html'),
        },
      },
    },
  }
})
