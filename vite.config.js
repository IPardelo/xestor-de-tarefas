import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import kdbxweb from 'kdbxweb'

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

const obterTextoCampo = (entry, nomeCampo) => {
  const valor = entry?.fields?.get?.(nomeCampo)
  if (valor == null) return ''
  if (typeof valor === 'string') return valor
  if (valor?.getText) return valor.getText()
  return String(valor)
}

const percorrerGrupos = (grupos = [], resultados = []) => {
  for (const grupo of grupos) {
    const nomeGrupo = grupo?.name || ''
    for (const entry of grupo.entries || []) {
      resultados.push({
        grupo: nomeGrupo,
        titulo: obterTextoCampo(entry, 'Title'),
        usuario: obterTextoCampo(entry, 'UserName'),
        url: obterTextoCampo(entry, 'URL'),
        notas: obterTextoCampo(entry, 'Notes'),
      })
    }
    percorrerGrupos(grupo.groups || [], resultados)
  }
  return resultados
}

const kdbxApiPlugin = () => ({
  name: 'kdbx-api',
  configureServer(server) {
    server.middlewares.use('/api/kdbx/read', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })

      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}')
          const { filePath, password } = parsed

          if (!filePath || !password) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'filePath and password are required' }))
            return
          }

          const appDataRaw = await readFile(dataFilePath, 'utf-8')
          const appData = JSON.parse(appDataRaw || '{}')
          const usuarioActualId = appData?.usuarios?.usuarioActualId
          const usuarioActual = (appData?.usuarios?.lista || []).find((u) => u.id === usuarioActualId)
          if (usuarioActual?.admin !== '1') {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Only admin users can read KDBX data' }))
            return
          }

          const dbBuffer = await readFile(filePath)
          const dbArrayBuffer = dbBuffer.buffer.slice(
            dbBuffer.byteOffset,
            dbBuffer.byteOffset + dbBuffer.byteLength
          )

          const credentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(password))
          const db = await kdbxweb.Kdbx.load(dbArrayBuffer, credentials)
          const grupoRaiz = db.getDefaultGroup()
          const entries = percorrerGrupos(grupoRaiz ? [grupoRaiz] : [])

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ entries }))
        } catch (error) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error?.message || 'Cannot read KDBX file' }))
        }
      })
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), appDataApiPlugin(), kdbxApiPlugin()],
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
