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
		establecerIdioma: (state, action) => {
			state.actual = action.payload;
			localStorage.setItem('idioma', state.actual);
		},
	},
});

export const { establecerIdioma } = idiomaSlice.actions;
export const seleccionarIdioma = (state) => state.idioma.actual;
export default idiomaSlice.reducer;
