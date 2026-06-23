import { createSlice, nanoid } from '@reduxjs/toolkit';

const KDBX_CONFIG_STORAGE_KEY = 'kdbx_config_local';
const DEFAULT_KDBX_CONFIG = {
	filePath: 'kdbx\\Database.kdbx',
	password: '1234567890',
};

const cargarKdbxConfigLocal = () => {
	try {
		const raw = localStorage.getItem(KDBX_CONFIG_STORAGE_KEY);
		if (!raw) return DEFAULT_KDBX_CONFIG;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') return DEFAULT_KDBX_CONFIG;
		return {
			filePath: (parsed.filePath || '').trim() || DEFAULT_KDBX_CONFIG.filePath,
			password: parsed.password || DEFAULT_KDBX_CONFIG.password,
		};
	} catch {
		return DEFAULT_KDBX_CONFIG;
	}
};

const gardarKdbxConfigLocal = (config) => {
	try {
		localStorage.setItem(KDBX_CONFIG_STORAGE_KEY, JSON.stringify(config));
	} catch {
		/* empty */
	}
};

const estadoInicial = {
	lista: [],
	kdbxConfig: cargarKdbxConfigLocal(),
	kdbxEntries: [],
};

const COLOR_PROXECTO_POR_DEFECTO = '#9333ea';

const normalizarProxecto = (proxecto) => ({
	id: proxecto?.id || nanoid(),
	nome: proxecto?.nome || '',
	clienteNome: proxecto?.clienteNome || '',
	clienteTelefono: proxecto?.clienteTelefono || '',
	clienteEmail: proxecto?.clienteEmail || '',
	url: proxecto?.url || '',
	prezoAcordado: proxecto?.prezoAcordado || '',
	dataLimiteEntrega: proxecto?.dataLimiteEntrega || '',
	cor: proxecto?.cor || COLOR_PROXECTO_POR_DEFECTO,
	creadoEn: proxecto?.creadoEn || new Date().toISOString(),
});

const proxectosSlice = createSlice({
	name: 'proxectos',
	initialState: estadoInicial,
	reducers: {
		hidratarProxectos: (state, action) => {
			const lista = action.payload?.lista;
			if (Array.isArray(lista)) {
				state.lista = lista.map(normalizarProxecto);
			}
		},
		engadirProxecto: (state, action) => {
			state.lista.unshift(
				normalizarProxecto({
					...action.payload,
					id: nanoid(),
					creadoEn: new Date().toISOString(),
				})
			);
		},
		actualizarProxecto: (state, action) => {
			const { id, ...cambios } = action.payload || {};
			if (!id) return;
			const indice = state.lista.findIndex((proxecto) => proxecto.id === id);
			if (indice === -1) return;
			state.lista[indice] = normalizarProxecto({
				...state.lista[indice],
				...cambios,
				id,
				creadoEn: state.lista[indice].creadoEn,
			});
		},
		eliminarProxecto: (state, action) => {
			const proxectoId = action.payload;
			if (!proxectoId) return;
			state.lista = state.lista.filter((proxecto) => proxecto.id !== proxectoId);
		},
		actualizarConfiguracionKdbx: (state, action) => {
			const payload = action.payload || {};
			state.kdbxConfig = {
				filePath: (payload.filePath || '').trim() || DEFAULT_KDBX_CONFIG.filePath,
				password: payload.password || DEFAULT_KDBX_CONFIG.password,
			};
			gardarKdbxConfigLocal(state.kdbxConfig);
		},
		establecerKdbxEntries: (state, action) => {
			state.kdbxEntries = Array.isArray(action.payload) ? action.payload : [];
		},
	},
});

export const {
	hidratarProxectos,
	engadirProxecto,
	actualizarProxecto,
	eliminarProxecto,
	actualizarConfiguracionKdbx,
	establecerKdbxEntries,
} =
	proxectosSlice.actions;
export const seleccionarProxectos = (state) => state.proxectos.lista || [];
export const seleccionarConfiguracionKdbx = (state) => state.proxectos.kdbxConfig || estadoInicial.kdbxConfig;
export const seleccionarKdbxEntries = (state) => state.proxectos.kdbxEntries || [];
export default proxectosSlice.reducer;
