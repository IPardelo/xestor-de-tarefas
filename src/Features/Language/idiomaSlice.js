import { createSlice } from '@reduxjs/toolkit';

const cargarIdioma = () => {
	try {
		const gardado = localStorage.getItem('idioma');
		return gardado || 'gl';
	} catch {
		return 'gl';
	}
};

const idiomaSlice = createSlice({
	name: 'idioma',
	initialState: {
		actual: cargarIdioma(),
	},
	reducers: {
		hidratarIdioma: (state, action) => {
			const idioma = action.payload?.actual;
			if (['gl', 'es', 'en'].includes(idioma)) {
				state.actual = idioma;
			}
		},
		establecerIdioma: (state, action) => {
			state.actual = action.payload;
			localStorage.setItem('idioma', state.actual);
		},
	},
});

export const { hidratarIdioma, establecerIdioma } = idiomaSlice.actions;
export const seleccionarIdioma = (state) => state.idioma.actual;
export default idiomaSlice.reducer;
