import { createSlice, nanoid } from '@reduxjs/toolkit';

const estadoInicial = {
	lista: [],
	kdbxConfig: {
		filePath: 'kdbx\\Database.kdbx',
		password: '1234567890',
	},
	kdbxEntries: [],
};

const normalizarProxecto = (proxecto) => ({
	id: proxecto?.id || nanoid(),
	nome: proxecto?.nome || '',
	clienteNome: proxecto?.clienteNome || '',
	clienteTelefono: proxecto?.clienteTelefono || '',
	clienteEmail: proxecto?.clienteEmail || '',
	prezoAcordado: proxecto?.prezoAcordado || '',
	dataLimiteEntrega: proxecto?.dataLimiteEntrega || '',
	creadoEn: proxecto?.creadoEn || new Date().toISOString(),
});

const proxectosSlice = createSlice({
	name: 'proxectos',
	initialState: estadoInicial,
	reducers: {
		hidratarProxectos: (state, action) => {
			const lista = action.payload?.lista;
			const kdbxConfig = action.payload?.kdbxConfig;
			if (Array.isArray(lista)) {
				state.lista = lista.map(normalizarProxecto);
			}
			if (kdbxConfig && typeof kdbxConfig === 'object') {
				state.kdbxConfig = {
					filePath: kdbxConfig.filePath || estadoInicial.kdbxConfig.filePath,
					password: kdbxConfig.password || estadoInicial.kdbxConfig.password,
				};
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
		actualizarConfiguracionKdbx: (state, action) => {
			const payload = action.payload || {};
			state.kdbxConfig = {
				filePath: (payload.filePath || '').trim() || estadoInicial.kdbxConfig.filePath,
				password: payload.password || estadoInicial.kdbxConfig.password,
			};
		},
		establecerKdbxEntries: (state, action) => {
			state.kdbxEntries = Array.isArray(action.payload) ? action.payload : [];
		},
	},
});

export const { hidratarProxectos, engadirProxecto, actualizarConfiguracionKdbx, establecerKdbxEntries } =
	proxectosSlice.actions;
export const seleccionarProxectos = (state) => state.proxectos.lista || [];
export const seleccionarConfiguracionKdbx = (state) => state.proxectos.kdbxConfig || estadoInicial.kdbxConfig;
export const seleccionarKdbxEntries = (state) => state.proxectos.kdbxEntries || [];
export default proxectosSlice.reducer;
