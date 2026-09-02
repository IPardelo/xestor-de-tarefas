import { hidratarUsuarios } from '@/Features/Users/usuariosSlice';
import { hidratarTareas } from '@/Features/Tasks/tareasSlice';
import { hidratarProxectos } from '@/Features/Projects/proxectosSlice';
import { hidratarNotas } from '@/Features/Notes/notasSlice';
import {
	enviarCambios,
	isCloudSyncEnabled,
	migrarSeFaiFalta,
	subscribirseAColeccion,
} from '@/App/persistence';

/*
 * Sincronización con Firebase, elemento a elemento.
 *
 * - Subida: un middleware de Redux compara o estado antes e despois de cada acción
 *   local e apunta que elementos cambiaron ou se borraron ("pendentes"). Só eses
 *   se escriben en Firebase. Os datos que chegan de Firebase non se volven subir.
 * - Os pendentes gárdanse en localStorage: se a app se pecha sen conexión, envíanse
 *   ao volver abrila.
 * - Non se escribe nada ata que a migración está feita e chegou a primeira lectura
 *   de todas as coleccións. Mentres, os cambios quedan na cola.
 * - Un borrado só se sube se o provoca unha acción local que borra un elemento
 *   concreto. Unha acción que borre varios á vez non borra nada en Firebase.
 */

const COLECCIONS = [
	{
		nome: 'usuarios',
		ler: (state) => state.usuarios?.lista || [],
		hidratar: (lista) => hidratarUsuarios({ lista }),
		novosAoPrincipio: false,
	},
	{
		nome: 'tarefas',
		ler: (state) => state.tareas?.tareas || [],
		hidratar: (lista) => hidratarTareas({ tareas: lista }),
		novosAoPrincipio: false,
	},
	{
		nome: 'proxectos',
		ler: (state) => state.proxectos?.lista || [],
		hidratar: (lista) => hidratarProxectos({ lista }),
		novosAoPrincipio: true,
	},
	{
		nome: 'notas',
		ler: (state) => state.notas?.notas || [],
		hidratar: (lista) => hidratarNotas({ notas: lista }),
		novosAoPrincipio: true,
	},
];

const CLAVE_PENDENTES = 'sync_pendentes';
const MAX_BORRADOS_POR_ACCION = 1;
const ESPERA_ENVIO_MS = 300;
const REINTENTO_MIN_MS = 3000;
const REINTENTO_MAX_MS = 60000;

// ---------- Utilidades ----------

const claveId = (item) =>
	item && (typeof item.id === 'string' || typeof item.id === 'number') ? String(item.id) : null;

const mapaPorId = (lista) => {
	const mapa = new Map();
	(lista || []).forEach((item) => {
		const id = claveId(item);
		if (id !== null) mapa.set(id, item);
	});
	return mapa;
};

const dataElemento = (item) =>
	item?.creadoEn || item?.creadaEn || item?.fechaCreacion || item?.actualizadaEn || '';

// ---------- Cola de pendentes (persistente) ----------

// { nomeColeccion: Map<id, contador> }; o contador distingue cambios feitos mentres se envía.
const pendentes = Object.fromEntries(COLECCIONS.map((c) => [c.nome, new Map()]));
let contador = 0;

const cargarPendentes = () => {
	try {
		const raw = JSON.parse(localStorage.getItem(CLAVE_PENDENTES) || '{}');
		COLECCIONS.forEach((c) => {
			(Array.isArray(raw?.[c.nome]) ? raw[c.nome] : []).forEach((id) => {
				pendentes[c.nome].set(String(id), ++contador);
			});
		});
	} catch {
		/* empty */
	}
};

const gardarPendentes = () => {
	try {
		const obxecto = Object.fromEntries(COLECCIONS.map((c) => [c.nome, [...pendentes[c.nome].keys()]]));
		localStorage.setItem(CLAVE_PENDENTES, JSON.stringify(obxecto));
	} catch {
		/* empty */
	}
};

const hai = () => COLECCIONS.some((c) => pendentes[c.nome].size > 0);

cargarPendentes();

// ---------- Estado da sincronización ----------

let store = null;
let listo = false; // migración feita e subscricións activas
const recibido = Object.fromEntries(COLECCIONS.map((c) => [c.nome, false]));
let enviando = false;
let temporizadorEnvio = null;
let reintentoMs = REINTENTO_MIN_MS;

const todoRecibido = () => COLECCIONS.every((c) => recibido[c.nome]);

// ---------- Middleware: detecta os cambios locais ----------

export const middlewareSincronizacion = (api) => (next) => (action) => {
	const antes = api.getState();
	const resultado = next(action);
	if (action?.meta?.orixeRemota) return resultado;

	const despois = api.getState();
	let houboCambios = false;

	COLECCIONS.forEach((c) => {
		const listaAntes = c.ler(antes);
		const listaDespois = c.ler(despois);
		if (listaAntes === listaDespois) return;

		const mapaAntes = mapaPorId(listaAntes);
		const mapaDespois = mapaPorId(listaDespois);

		mapaDespois.forEach((item, id) => {
			if (mapaAntes.get(id) !== item) {
				pendentes[c.nome].set(id, ++contador);
				houboCambios = true;
			}
		});

		const borrados = [...mapaAntes.keys()].filter((id) => !mapaDespois.has(id));
		if (borrados.length > MAX_BORRADOS_POR_ACCION) {
			console.warn(
				`[sincronizacion] "${action?.type}" borraría ${borrados.length} elementos de ${c.nome}; non se borran en Firebase.`
			);
			return;
		}
		borrados.forEach((id) => {
			pendentes[c.nome].set(id, ++contador);
			houboCambios = true;
		});
	});

	if (houboCambios) {
		gardarPendentes();
		programarEnvio();
	}
	return resultado;
};

// ---------- Envío ----------

function programarEnvio(espera = ESPERA_ENVIO_MS) {
	clearTimeout(temporizadorEnvio);
	temporizadorEnvio = setTimeout(enviarPendentes, espera);
}

async function enviarPendentes() {
	if (!store || !listo || enviando || !todoRecibido() || !hai()) return;
	enviando = true;

	const state = store.getState();
	const enviados = [];
	const cambios = [];
	COLECCIONS.forEach((c) => {
		const actuais = mapaPorId(c.ler(state));
		pendentes[c.nome].forEach((version, id) => {
			cambios.push({ nome: c.nome, id, item: actuais.get(id) || null });
			enviados.push({ nome: c.nome, id, version });
		});
	});

	try {
		await enviarCambios(cambios);
		// Quítanse só os que non volveron cambiar mentres se enviaban.
		enviados.forEach(({ nome, id, version }) => {
			if (pendentes[nome].get(id) === version) pendentes[nome].delete(id);
		});
		gardarPendentes();
		reintentoMs = REINTENTO_MIN_MS;
	} catch (error) {
		console.error('[sincronizacion] Erro ao gardar en Firebase; reinténtase:', error);
		programarEnvio(reintentoMs);
		reintentoMs = Math.min(reintentoMs * 2, REINTENTO_MAX_MS);
	} finally {
		enviando = false;
		if (hai()) programarEnvio();
	}
}

// ---------- Recepción ----------

/** Combina o que chega de Firebase co estado local, respectando os cambios aínda sen subir. */
function combinar(coleccion, listaLocal, remotos) {
	const pendentesColeccion = pendentes[coleccion.nome];
	const mapaRemoto = mapaPorId(remotos);
	const mapaLocal = mapaPorId(listaLocal);

	// Os pendentes mandan: versión local se existe, ausencia se se borrou en local.
	pendentesColeccion.forEach((_, id) => {
		if (mapaLocal.has(id)) mapaRemoto.set(id, mapaLocal.get(id));
		else mapaRemoto.delete(id);
	});

	// Mantense a orde local; os novos van ao principio ou ao final segundo a colección.
	const resultado = [];
	listaLocal.forEach((item) => {
		const id = claveId(item);
		if (id !== null && mapaRemoto.has(id)) {
			resultado.push(mapaRemoto.get(id));
			mapaRemoto.delete(id);
		}
	});
	const novos = [...mapaRemoto.values()].sort((a, b) =>
		String(dataElemento(a)).localeCompare(String(dataElemento(b)))
	);
	return coleccion.novosAoPrincipio ? [...novos.reverse(), ...resultado] : [...resultado, ...novos];
}

function onDatosColeccion(coleccion, remotos, snapshot) {
	const listaLocal = coleccion.ler(store.getState());

	// Protección: unha lectura baleira dende a caché non borra os datos locais.
	if (snapshot.empty && snapshot.metadata.fromCache && listaLocal.length > 0) return;

	const primeiraVez = !recibido[coleccion.nome];
	recibido[coleccion.nome] = true;

	// Firebase sen usuarios (instalación nova): súbense os usuarios locais por defecto.
	if (coleccion.nome === 'usuarios' && snapshot.empty && !snapshot.metadata.fromCache) {
		mapaPorId(listaLocal).forEach((_, id) => pendentes.usuarios.set(id, ++contador));
		gardarPendentes();
	} else {
		store.dispatch({ ...coleccion.hidratar(combinar(coleccion, listaLocal, remotos)), meta: { orixeRemota: true } });
	}

	if (primeiraVez && todoRecibido()) programarEnvio(0);
}

// ---------- Arranque ----------

/**
 * Arranca a sincronización. Se non hai conexión, a app funciona cos datos locais
 * e reinténtase ata conseguir migrar e subscribirse.
 */
export function iniciarSincronizacion(storeApp) {
	store = storeApp;
	if (!isCloudSyncEnabled()) {
		console.warn('[sincronizacion] Firebase non está configurado: só datos locais.');
		return;
	}

	let intento = REINTENTO_MIN_MS;
	let temporizadorArranque = null;
	let arrancando = false;

	const arrancar = async () => {
		clearTimeout(temporizadorArranque);
		if (listo || arrancando) return;
		arrancando = true;
		try {
			const resultado = await migrarSeFaiFalta();
			if (resultado.migrado) {
				console.info(`[sincronizacion] Migración feita (${resultado.elementosMigrados} elementos).`);
			}
			COLECCIONS.forEach((c) => {
				subscribirseAColeccion(
					c.nome,
					(remotos, snapshot) => onDatosColeccion(c, remotos, snapshot),
					(error) => console.error(`[sincronizacion] Erro escoitando ${c.nome}:`, error)
				);
			});
			listo = true;
			window.removeEventListener('online', arrancar);
		} catch (error) {
			console.warn('[sincronizacion] Sen conexión con Firebase; reinténtase:', error?.message || error);
			temporizadorArranque = setTimeout(arrancar, intento);
			intento = Math.min(intento * 2, REINTENTO_MAX_MS);
		} finally {
			arrancando = false;
		}
	};

	window.addEventListener('online', arrancar);
	arrancar();
}
