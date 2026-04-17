import { configureStore } from '@reduxjs/toolkit';
import tareasReducer from '@/Features/Tasks/tareasSlice';
import temaReducer from '@/Features/Theme/temaSlice';
import idiomaReducer from '@/Features/Language/idiomaSlice';
import usuariosReducer from '@/Features/Users/usuariosSlice';

export const store = configureStore({
	reducer: {
		tareas: tareasReducer,
		tema: temaReducer,
		idioma: idiomaReducer,
		usuarios: usuariosReducer,
	},
});
