import { createSlice } from '@reduxjs/toolkit';

const USERS_KEY = 'usuarios';
const CURRENT_USER_KEY = 'usuario_actual_id';

const normalizarXenero = (valor) => {
	if (valor === 'M' || valor === 'F') return valor;
	if (valor === 'masculino') return 'M';
	if (valor === 'feminino') return 'F';
	return 'F';
};

const normalizarAdmin = (valor, id, nome) => {
	const coincideConIsmael = id === 'ismael' || nome === 'Ismael Castiñeira';
	if (coincideConIsmael) return '1';
	return valor === '1' ? '1' : '0';
};

const normalizarCalendariosIcal = (valor) => {
	if (!Array.isArray(valor)) return [];
	return valor
		.slice(0, 3)
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter(Boolean);
};

const normalizarUsuario = (usuario) => ({
	...usuario,
	xenero: normalizarXenero(usuario?.xenero),
	imaxePerfil: usuario?.imaxePerfil || '',
	contrasenha: String(usuario?.contrasenha || ''),
	admin: normalizarAdmin(usuario?.admin, usuario?.id, usuario?.nome),
	calendariosIcal: normalizarCalendariosIcal(usuario?.calendariosIcal),
});

const usuariosPorDefecto = [
	{
		id: 'ismael',
		nome: 'Ismael Castiñeira',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'oscuro',
		xenero: 'M',
		admin: '1',
	},
	{
		id: 'niki',
		nome: 'Nicole Papin',
		idiomaPredeterminado: 'es',
		temaPredeterminado: 'claro',
		xenero: 'F',
		admin: '0',
	},
	{
		id: 'dani',
		nome: 'Daniela Castiñeira',
		idiomaPredeterminado: 'en',
		temaPredeterminado: 'claro',
		xenero: 'F',
		admin: '0',
	},
];

const cargarUsuarios = () => {
	try {
		const gardados = localStorage.getItem(USERS_KEY);
		if (!gardados) return usuariosPorDefecto;
		const parsed = JSON.parse(gardados);
		return Array.isArray(parsed) && parsed.length > 0
			? parsed.map(normalizarUsuario)
			: usuariosPorDefecto;
	} catch {
		return usuariosPorDefecto;
	}
};

const cargarUsuarioActualId = (usuarios) => {
	try {
		const gardado = localStorage.getItem(CURRENT_USER_KEY);
		if (gardado && usuarios.some((u) => u.id === gardado)) return gardado;
		return usuarios[0]?.id || null;
	} catch {
		return usuarios[0]?.id || null;
	}
};

const usuariosIniciales = cargarUsuarios();

const usuariosSlice = createSlice({
	name: 'usuarios',
	initialState: {
		lista: usuariosIniciales,
		usuarioActualId: cargarUsuarioActualId(usuariosIniciales),
	},
	reducers: {
		hidratarUsuarios: (state, action) => {
			const lista = action.payload?.lista;
			const usuarioActualId = action.payload?.usuarioActualId;
			if (Array.isArray(lista) && lista.length > 0) {
				state.lista = lista.map(normalizarUsuario);
			}
			if (usuarioActualId && state.lista.some((u) => u.id === usuarioActualId)) {
				state.usuarioActualId = usuarioActualId;
			}
		},
		cambiarUsuario: (state, action) => {
			const novoId = action.payload;
			if (!state.lista.some((u) => u.id === novoId)) return;
			state.usuarioActualId = novoId;
			localStorage.setItem(CURRENT_USER_KEY, novoId);
		},
		establecerXeneroUsuarioActual: (state, action) => {
			const xenero = normalizarXenero(action.payload);
			const usuario = state.lista.find((u) => u.id === state.usuarioActualId);
			if (!usuario) return;
			usuario.xenero = xenero;
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
		actualizarPreferenciasUsuarioActual: (state, action) => {
			const usuario = state.lista.find((u) => u.id === state.usuarioActualId);
			if (!usuario) return;
			const payload = action.payload || {};
			if (typeof payload.imaxePerfil === 'string') usuario.imaxePerfil = payload.imaxePerfil.trim();
			if (['gl', 'es', 'en'].includes(payload.idiomaPredeterminado)) {
				usuario.idiomaPredeterminado = payload.idiomaPredeterminado;
			}
			if (['claro', 'oscuro'].includes(payload.temaPredeterminado)) {
				usuario.temaPredeterminado = payload.temaPredeterminado;
			}
			if (payload.xenero) usuario.xenero = normalizarXenero(payload.xenero);
			if (typeof payload.contrasenha === 'string') usuario.contrasenha = payload.contrasenha;
			if (Array.isArray(payload.calendariosIcal)) {
				usuario.calendariosIcal = normalizarCalendariosIcal(payload.calendariosIcal);
			}
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
		rexistrarUsuario: (state, action) => {
			const actual = state.lista.find((u) => u.id === state.usuarioActualId);
			if (!actual || actual.admin !== '1') return;
			const payload = action.payload || {};
			const novoId = (payload.id || '').trim();
			const novoNome = (payload.nome || '').trim();
			if (!novoId || !novoNome) return;
			if (state.lista.some((u) => u.id === novoId)) return;
			state.lista.push(
				normalizarUsuario({
					id: novoId,
					nome: novoNome,
					contrasenha: String(payload.contrasenha || ''),
					idiomaPredeterminado: payload.idiomaPredeterminado || 'gl',
					temaPredeterminado: payload.temaPredeterminado || 'claro',
					xenero: payload.xenero || 'F',
					imaxePerfil: payload.imaxePerfil || '',
					admin: payload.admin || '0',
				})
			);
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
		rexistrarUsuarioDesdeLogin: (state, action) => {
			const payload = action.payload || {};
			const novoId = (payload.id || '').trim();
			const novoNome = (payload.nome || '').trim();
			const novaContrasenha = String(payload.contrasenha || '');
			if (!novoId || !novoNome || !novaContrasenha) return;
			if (state.lista.some((u) => u.id === novoId)) return;
			state.lista.push(
				normalizarUsuario({
					id: novoId,
					nome: novoNome,
					contrasenha: novaContrasenha,
					idiomaPredeterminado: payload.idiomaPredeterminado || 'gl',
					temaPredeterminado: payload.temaPredeterminado || 'claro',
					xenero: payload.xenero || 'F',
					imaxePerfil: payload.imaxePerfil || '',
					admin: '0',
				})
			);
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
		cambiarContrasinalDesdeLogin: (state, action) => {
			const payload = action.payload || {};
			const id = (payload.id || '').trim();
			const contrasenhaActual = String(payload.contrasenhaActual || '');
			const novaContrasenha = String(payload.novaContrasenha || '');
			if (!id || !contrasenhaActual || !novaContrasenha) return;
			const usuario = state.lista.find((u) => u.id === id);
			if (!usuario) return;
			if (String(usuario.contrasenha || '') !== contrasenhaActual) return;
			usuario.contrasenha = novaContrasenha;
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
		actualizarUsuario: (state, action) => {
			const actual = state.lista.find((u) => u.id === state.usuarioActualId);
			if (!actual || actual.admin !== '1') return;
			const { idOriginal, id, ...cambios } = action.payload || {};
			const idBase = (idOriginal || '').trim();
			const novoId = (id || idBase).trim();
			if (!idBase || !novoId) return;
			const indice = state.lista.findIndex((u) => u.id === idBase);
			if (indice === -1) return;
			if (novoId !== idBase && state.lista.some((u) => u.id === novoId)) return;
			const usuarioActualizado = {
				...state.lista[indice],
				...cambios,
				id: novoId,
				nome: (cambios.nome ?? state.lista[indice].nome ?? '').trim(),
				imaxePerfil:
					typeof cambios.imaxePerfil === 'string'
						? cambios.imaxePerfil.trim()
						: state.lista[indice].imaxePerfil || '',
			};
			if (!usuarioActualizado.nome) return;
			state.lista[indice] = normalizarUsuario(usuarioActualizado);
			if (state.usuarioActualId === idBase) {
				state.usuarioActualId = novoId;
				localStorage.setItem(CURRENT_USER_KEY, novoId);
			}
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
		eliminarUsuario: (state, action) => {
			const actual = state.lista.find((u) => u.id === state.usuarioActualId);
			if (!actual || actual.admin !== '1') return;
			const idAEliminar = action.payload;
			if (!idAEliminar || idAEliminar === 'ismael' || idAEliminar === state.usuarioActualId) return;
			state.lista = state.lista.filter((u) => u.id !== idAEliminar);
			localStorage.setItem(USERS_KEY, JSON.stringify(state.lista));
		},
	},
});

export const {
	hidratarUsuarios,
	cambiarUsuario,
	establecerXeneroUsuarioActual,
	actualizarPreferenciasUsuarioActual,
	rexistrarUsuario,
	rexistrarUsuarioDesdeLogin,
	cambiarContrasinalDesdeLogin,
	actualizarUsuario,
	eliminarUsuario,
} = usuariosSlice.actions;
export const seleccionarUsuarios = (state) => state.usuarios.lista;
export const seleccionarUsuarioActualId = (state) => state.usuarios.usuarioActualId;
export const seleccionarUsuarioActual = (state) =>
	state.usuarios.lista.find((u) => u.id === state.usuarios.usuarioActualId) || null;
export const seleccionarUsuariosExceptoActual = (state) =>
	state.usuarios.lista.filter((u) => u.id !== state.usuarios.usuarioActualId);
export const seleccionarUsuarioActualAdmin = (state) =>
	(state.usuarios.lista.find((u) => u.id === state.usuarios.usuarioActualId)?.admin || '0') === '1';

export default usuariosSlice.reducer;
