// App de escritorio (Electron): abre XestorDeTarefas nunha ventá propia, sen navegador
// nin consola. Ábrese con XestorDeTarefas.vbs (ou `npm run desktop`).
//
// Arranca Vite dentro da propia app e carga o código de src/ directamente: non hai que
// compilar nada e os cambios vense ao momento, mesmo coa ventá aberta. O servidor só é
// accesible dende este ordenador (127.0.0.1) e inclúe a API local /api/kdbx/read e
// /api/ical (config/apiLocal.js).

import { app, BrowserWindow, Menu, dialog, shell } from 'electron'
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

// Porto fixo: a orixe (http://127.0.0.1:PORTO) ten que ser sempre a mesma para que
// os datos gardados no navegador interno (localStorage) se conserven entre aperturas.
const PORTO = 47831

const CARPETA_APP = app.getAppPath()
const FICHEIRO_VENTA = path.join(app.getPath('userData'), 'venta.json')

// ---------- Vite ----------

async function arrancarVite() {
	const servidor = await createServer({
		root: CARPETA_APP,
		configFile: path.join(CARPETA_APP, 'config', 'vite.config.js'),
		// Se o porto está ocupado por outro programa úsase outro (a sesión local non se conserva).
		server: { host: '127.0.0.1', port: PORTO, strictPort: false },
		clearScreen: false,
	})
	await servidor.listen()
	app.on('will-quit', () => servidor.close())
	return servidor.httpServer.address().port
}

// ---------- Ventá ----------

async function lerTamanoVenta() {
	try {
		const datos = JSON.parse(await readFile(FICHEIRO_VENTA, 'utf8'))
		if (datos && datos.width > 300 && datos.height > 300) return datos
	} catch {
		/* primeira vez */
	}
	return { width: 1280, height: 820 }
}

async function crearVenta(url) {
	const tamano = await lerTamanoVenta()
	const venta = new BrowserWindow({
		...tamano,
		minWidth: 380,
		minHeight: 500,
		show: false,
		title: 'XestorDeTarefas',
		icon: path.join(CARPETA_APP, 'desktop', 'icon.png'),
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	})
	if (tamano.maximized) venta.maximize()

	venta.once('ready-to-show', () => venta.show())

	// As ligazóns externas (calendarios, webs dos clientes...) ábrense no navegador do sistema.
	venta.webContents.setWindowOpenHandler(({ url: destino }) => {
		if (/^https?:\/\//.test(destino)) shell.openExternal(destino)
		return { action: 'deny' }
	})
	venta.webContents.on('will-navigate', (evento, destino) => {
		if (!destino.startsWith(url)) {
			evento.preventDefault()
			if (/^https?:\/\//.test(destino)) shell.openExternal(destino)
		}
	})

	venta.on('close', () => {
		const datos = { ...venta.getNormalBounds(), maximized: venta.isMaximized() }
		try {
			writeFileSync(FICHEIRO_VENTA, JSON.stringify(datos))
		} catch {
			/* non é importante */
		}
	})

	await venta.loadURL(url)
	return venta
}

// ---------- Arranque ----------

// Só unha instancia: se xa está aberta, tráese ao frente.
if (!app.requestSingleInstanceLock()) {
	app.quit()
} else {
	app.on('second-instance', () => {
		const venta = BrowserWindow.getAllWindows()[0]
		if (!venta) return
		if (venta.isMinimized()) venta.restore()
		venta.focus()
	})

	app.whenReady().then(async () => {
		Menu.setApplicationMenu(null)
		let porto
		try {
			porto = await arrancarVite()
		} catch (error) {
			dialog.showErrorBox('XestorDeTarefas', `Non se puido arrancar a app:\n\n${error?.stack || error}`)
			app.quit()
			return
		}
		const url = `http://127.0.0.1:${porto}/`
		await crearVenta(url)

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) crearVenta(url)
		})
	})

	app.on('window-all-closed', () => app.quit())
}
