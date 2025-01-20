// API local da app: lectura de bases KeePass (.kdbx) e proxy de calendarios iCal.
// Úsaas o servidor de Vite (config/vite.config.js), tanto na web como na app de escritorio.
// Recibe un obxecto con `use(ruta, (req, res) => ...)`, como os middlewares de Vite.

import path from 'node:path'
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

const rexistrarRutaKdbx = (middlewares, baseDir) => {
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

          const dbBuffer = await readFile(path.resolve(baseDir, filePath))
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

// Proxy para calendarios iCal: Google non permite descargalos dende o navegador (CORS),
// así que os descarga o servidor local de Vite. Só acepta URL http(s) que devolvan un .ics.
const ICAL_TEMPO_MAXIMO_MS = 15000
const ICAL_TAMANO_MAXIMO = 10 * 1024 * 1024

const rexistrarRutaIcal = (middlewares) => {
  middlewares.use('/api/ical', async (req, res) => {
    const responderErro = (status, error) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error }))
    }

    if (req.method !== 'GET') return responderErro(405, 'Method not allowed')

    let destino
    try {
      const parametro = new URL(req.url, 'http://localhost').searchParams.get('url') || ''
      destino = new URL(parametro.replace(/^webcal:\/\//, 'https://'))
    } catch {
      return responderErro(400, 'URL inválida')
    }
    if (!['http:', 'https:'].includes(destino.protocol)) return responderErro(400, 'Só se admiten URL http(s)')

    const controller = new AbortController()
    const temporizador = setTimeout(() => controller.abort(), ICAL_TEMPO_MAXIMO_MS)
    try {
      const resposta = await fetch(destino, { signal: controller.signal, redirect: 'follow' })
      if (!resposta.ok) return responderErro(502, `O calendario respondeu HTTP ${resposta.status}`)
      const texto = await resposta.text()
      if (texto.length > ICAL_TAMANO_MAXIMO) return responderErro(502, 'Calendario demasiado grande')
      if (!texto.includes('BEGIN:VCALENDAR')) return responderErro(502, 'A URL non devolve un calendario iCal')
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(texto)
    } catch (error) {
      responderErro(502, error?.name === 'AbortError' ? 'Tempo esgotado' : error?.message || 'Erro descargando o calendario')
    } finally {
      clearTimeout(temporizador)
    }
  })
}


/**
 * Rexistra as rutas /api/kdbx/read e /api/ical.
 * @param middlewares obxecto con use(ruta, handler)
 * @param {{ baseDir?: string }} opcions baseDir: carpeta desde a que se resolven as rutas .kdbx relativas
 */
export const rexistrarApiLocal = (middlewares, { baseDir = process.cwd() } = {}) => {
  rexistrarRutaKdbx(middlewares, baseDir)
  rexistrarRutaIcal(middlewares)
}
