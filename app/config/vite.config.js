import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rexistrarApiLocal } from './apiLocal.js'

// /api/kdbx/read e /api/ical (código en config/apiLocal.js, compartido coa app de escritorio).
const kdbxApiPlugin = () => ({
  name: 'kdbx-api',
  configureServer(server) {
    rexistrarApiLocal(server.middlewares)
  },
  configurePreviewServer(server) {
    rexistrarApiLocal(server.middlewares)
  },
})

// Extensións que Vite proba ao resolver un import sen extensión.
const EXTENSIONS_BASE = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']

// No modo "android" (npm run build:android / dev:android) primeiro búscase a
// variante "Compoñente.android.jsx" e, se non existe, úsase "Compoñente.jsx".
// Así a app só ten ficheiros propios nas vistas que realmente cambian.
const extensionsPorPlataforma = (mode) =>
  mode === 'android'
    ? [...EXTENSIONS_BASE.map((ext) => `.android${ext}`), ...EXTENSIONS_BASE]
    : EXTENSIONS_BASE

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), kdbxApiPlugin()],
  resolve: {
    alias: {
      '@': '/src',
    },
    extensions: extensionsPorPlataforma(mode),
  },
}))
