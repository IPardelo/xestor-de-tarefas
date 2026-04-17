import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const dataFilePath = resolve(__dirname, 'app-data.json')

const appDataApiPlugin = () => ({
  name: 'app-data-api',
  configureServer(server) {
    server.middlewares.use('/api/app-data', async (req, res) => {
      if (req.method === 'GET') {
        try {
          const content = await readFile(dataFilePath, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(content)
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Cannot read app-data.json' }))
        }
        return
      }

      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}')
            await writeFile(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          }
        })
        return
      }

      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), appDataApiPlugin()],
  server: {
    watch: {
      ignored: ['**/app-data.json'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
