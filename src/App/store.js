import { configureStore } from '@reduxjs/toolkit';
import tareasReducer from '@/Features/Tasks/tareasSlice';
import temaReducer from '@/Features/Theme/temaSlice';
import idiomaReducer from '@/Features/Language/idiomaSlice';
import usuariosReducer from '@/Features/Users/usuariosSlice';
import proxectosReducer from '@/Features/Projects/proxectosSlice';
import notasReducer from '@/Features/Notes/notasSlice';

export const store = configureStore({
	reducer: {
		tareas: tareasReducer,
		tema: temaReducer,
		idioma: idiomaReducer,
		usuarios: usuariosReducer,
		proxectos: proxectosReducer,
		notas: notasReducer,
	},
});
