import { createSlice, nanoid } from '@reduxjs/toolkit';

// Copia local dos proxectos: se Firebase non responde, non se arranca cunha lista baleira.
const PROXECTOS_STORAGE_KEY = 'proxectos';

const cargarProxectosLocais = () => {
	try {
		const parsed = JSON.parse(localStorage.getItem(PROXECTOS_STORAGE_KEY) || '[]');
		return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.id === 'string') : [];
	} catch {
		return [];
	}
};

const gardarProxectosLocais = (lista) => {
	try {
		localStorage.setItem(PROXECTOS_STORAGE_KEY, JSON.stringify(lista));
	} catch {
		/* empty */
	}
};

const estadoInicial = {
	lista: cargarProxectosLocais(),
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
				gardarProxectosLocais(state.lista);
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
			gardarProxectosLocais(state.lista);
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
			gardarProxectosLocais(state.lista);
		},
		eliminarProxecto: (state, action) => {
			const proxectoId = action.payload;
			if (!proxectoId) return;
			state.lista = state.lista.filter((proxecto) => proxecto.id !== proxectoId);
			gardarProxectosLocais(state.lista);
		},
	},
});

export const {
	hidratarProxectos,
	engadirProxecto,
	actualizarProxecto,
	eliminarProxecto,
} =
	proxectosSlice.actions;
export const seleccionarProxectos = (state) => state.proxectos.lista || [];
export default proxectosSlice.reducer;
