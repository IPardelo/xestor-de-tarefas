// Importaciones
import { createSlice } from '@reduxjs/toolkit';

// Función para cargar la preferencia de tema del localStorage
const cargarTemaDelAlmacenamiento = () => {
	try {
		const temaAlmacenado = localStorage.getItem('tema');
		if (temaAlmacenado) {
			return temaAlmacenado;
		}

		// Si no hay tema guardado, detectar preferencia del sistema
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'oscuro';
		}

		return 'claro';
	} catch (error) {
		console.error('Error al cargar tema del localStorage:', error);
		return 'claro';
	}
};

// Estado inicial
const estadoInicial = {
	modo: cargarTemaDelAlmacenamiento(),
};

export const temaSlice = createSlice({
	name: 'tema',
	initialState: estadoInicial,
	reducers: {
		hidratarTema: (state, action) => {
			const modo = action.payload?.modo;
			if (modo === 'claro' || modo === 'oscuro') {
				state.modo = modo;
			}
		},
		alternarTema: (state) => {
			state.modo = state.modo === 'oscuro' ? 'claro' : 'oscuro';
			localStorage.setItem('tema', state.modo);

			// Aplicar clase al elemento HTML para el tema oscuro
			if (state.modo === 'oscuro') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		},
		establecerTema: (state, action) => {
			state.modo = action.payload;
			localStorage.setItem('tema', state.modo);

			// Aplicar clase al elemento HTML para el tema oscuro
			if (state.modo === 'oscuro') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		},
	},
});

// Acciones
export const { hidratarTema, alternarTema, establecerTema } = temaSlice.actions;

// Selectores
export const seleccionarTema = (state) => state.tema.modo;

export default temaSlice.reducer;
