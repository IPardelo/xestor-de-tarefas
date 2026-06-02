import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFile } from 'node:fs/promises'
import kdbxweb from 'kdbxweb'

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
        password: obterTextoCampo(entry, 'Password'),
        url: obterTextoCampo(entry, 'URL'),
        notas: obterTextoCampo(entry, 'Notes'),
      })
    }
    percorrerGrupos(grupo.groups || [], resultados)
  }
  return resultados
}

const rexistrarRutaKdbx = (middlewares) => {
  middlewares.use('/api/kdbx/read', async (req, res) => {
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
}

const kdbxApiPlugin = () => ({
  name: 'kdbx-api',
  configureServer(server) {
    rexistrarRutaKdbx(server.middlewares)
  },
  configurePreviewServer(server) {
    rexistrarRutaKdbx(server.middlewares)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), kdbxApiPlugin()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
