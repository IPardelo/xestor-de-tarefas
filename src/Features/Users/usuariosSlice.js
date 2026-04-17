import { createSlice } from '@reduxjs/toolkit';

const USERS_KEY = 'usuarios';
const CURRENT_USER_KEY = 'usuario_actual_id';

const normalizarXenero = (valor) => {
	if (valor === 'M' || valor === 'F') return valor;
	if (valor === 'masculino') return 'M';
	if (valor === 'feminino') return 'F';
	return 'F';
};

const normalizarUsuario = (usuario) => ({
	...usuario,
	xenero: normalizarXenero(usuario?.xenero),
});

const usuariosPorDefecto = [
	{
        id: "ismael",
        nome: "Ismael Castiñeira",
        idiomaPredeterminado: "gl",
        temaPredeterminado: "oscuro",
        xenero: "M"
      },
      {
        id: "niki",
        nome: "Nicole Papin",
        idiomaPredeterminado: "es",
        temaPredeterminado: "claro",
        xenero: "F"
      },
      {
        id: "dani",
        nome: "Daniela Castiñeira",
        idiomaPredeterminado: "en",
        temaPredeterminado: "claro",
        xenero: "F"
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
	},
});

export const { hidratarUsuarios, cambiarUsuario, establecerXeneroUsuarioActual } = usuariosSlice.actions;
export const seleccionarUsuarios = (state) => state.usuarios.lista;
export const seleccionarUsuarioActualId = (state) => state.usuarios.usuarioActualId;
export const seleccionarUsuarioActual = (state) =>
	state.usuarios.lista.find((u) => u.id === state.usuarios.usuarioActualId) || null;
export const seleccionarUsuariosExceptoActual = (state) =>
	state.usuarios.lista.filter((u) => u.id !== state.usuarios.usuarioActualId);

export default usuariosSlice.reducer;
