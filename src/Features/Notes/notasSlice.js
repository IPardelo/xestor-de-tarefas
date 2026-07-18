import { createSlice, createSelector } from '@reduxjs/toolkit';

const STORAGE_KEY = 'notas';

const cargarNotasDoAlmacenamento = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((nota) => nota && typeof nota.id === 'string');
	} catch {
		return [];
	}
};

const gardarNotasNoAlmacenamento = (notas) => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
};

const estadoInicial = {
	notas: cargarNotasDoAlmacenamento(),
};

const normalizarCorNota = (cor) => {
	if (typeof cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(cor.trim())) return cor.trim();
	if (cor === 'azul') return '#38bdf8';
	if (cor === 'lila') return '#a855f7';
	if (cor === 'verde') return '#34d399';
	return '#9333ea';
};

const normalizarItensLista = (itens) => {
	if (!Array.isArray(itens)) return [];
	return itens
		.filter((item) => item && typeof item.id === 'string')
		.map((item) => ({
			id: item.id,
			texto: String(item.texto || '').trim(),
			completado: Boolean(item.completado),
		}))
		.filter((item) => item.texto);
};

const podeEditarNota = (nota, usuarioId) => {
	if (!nota || !usuarioId) return false;
	return nota.usuarioId === usuarioId;
};

const notasSlice = createSlice({
	name: 'notas',
	initialState: estadoInicial,
	reducers: {
		hidratarNotas: (state, action) => {
			const payload = action.payload || {};
			if (Array.isArray(payload.notas)) {
				state.notas = payload.notas
					.filter((nota) => nota && typeof nota.id === 'string')
					.map((nota) => ({
						...nota,
						tipo: nota.tipo === 'lista' ? 'lista' : 'texto',
						itensLista: normalizarItensLista(nota.itensLista),
						cor: normalizarCorNota(nota.cor),
					}));
			}
		},
		agregarNota: (state, action) => {
			const payload = action.payload || {};
			const titulo = payload.titulo?.trim() || '';
			const contido = payload.contido?.trim() || '';
			const tipo = payload.tipo === 'lista' ? 'lista' : 'texto';
			const itensLista = normalizarItensLista(payload.itensLista);
			if (!titulo && !contido && itensLista.length === 0) return;

			const novaNota = {
				id: payload.id,
				usuarioId: payload.usuarioId,
				titulo,
				contido,
				tipo,
				itensLista,
				cor: normalizarCorNota(payload.cor),
				fixada: Boolean(payload.fixada),
				creadaEn: payload.creadaEn || new Date().toISOString(),
				actualizadaEn: new Date().toISOString(),
			};
			state.notas.unshift(novaNota);
			gardarNotasNoAlmacenamento(state.notas);
		},
		actualizarNota: (state, action) => {
			const { id, usuarioId, titulo, contido, cor, tipo, itensLista } = action.payload || {};
			const nota = state.notas.find((item) => item.id === id && podeEditarNota(item, usuarioId));
			if (!nota) return;
			nota.titulo = titulo?.trim() || '';
			nota.contido = contido?.trim() || '';
			nota.tipo = tipo === 'lista' ? 'lista' : 'texto';
			nota.itensLista = normalizarItensLista(itensLista);
			nota.cor = normalizarCorNota(cor || nota.cor);
			nota.actualizadaEn = new Date().toISOString();
			gardarNotasNoAlmacenamento(state.notas);
		},
		eliminarNota: (state, action) => {
			const { id, usuarioId } = action.payload || {};
			state.notas = state.notas.filter((nota) => !(nota.id === id && podeEditarNota(nota, usuarioId)));
			gardarNotasNoAlmacenamento(state.notas);
		},
		alternarNotaFixada: (state, action) => {
			const { id, usuarioId } = action.payload || {};
			const nota = state.notas.find((item) => item.id === id && podeEditarNota(item, usuarioId));
			if (!nota) return;
			nota.fixada = !nota.fixada;
			nota.actualizadaEn = new Date().toISOString();
			gardarNotasNoAlmacenamento(state.notas);
		},
		alternarItemListaNota: (state, action) => {
			const { id, usuarioId, itemId } = action.payload || {};
			const nota = state.notas.find((item) => item.id === id && podeEditarNota(item, usuarioId));
			if (!nota || nota.tipo !== 'lista') return;
			const itemLista = (nota.itensLista || []).find((item) => item.id === itemId);
			if (!itemLista) return;
			itemLista.completado = !itemLista.completado;
			nota.actualizadaEn = new Date().toISOString();
			gardarNotasNoAlmacenamento(state.notas);
		},
	},
});

export const {
	hidratarNotas,
	agregarNota,
	actualizarNota,
	eliminarNota,
	alternarNotaFixada,
	alternarItemListaNota,
} = notasSlice.actions;

export const seleccionarNotas = (state) => state.notas?.notas || [];
export const seleccionarNotasUsuarioActual = createSelector(
	[(state) => seleccionarNotas(state), (state) => state.usuarios?.usuarioActualId],
	(notas, usuarioId) =>
		notas
			.filter((nota) => nota?.usuarioId === usuarioId)
			.sort((a, b) => {
				if (Boolean(b.fixada) !== Boolean(a.fixada)) return Number(b.fixada) - Number(a.fixada);
				return new Date(b.actualizadaEn || 0) - new Date(a.actualizadaEn || 0);
			})
);

export default notasSlice.reducer;
