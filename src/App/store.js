import { configureStore } from '@reduxjs/toolkit';
import tareasReducer from '@/Features/Tasks/tareasSlice';
import temaReducer from '@/Features/Theme/temaSlice';
import idiomaReducer from '@/Features/Language/idiomaSlice';

export const store = configureStore({
	reducer: {
		tareas: tareasReducer,
		tema: temaReducer,
		idioma: idiomaReducer,
	},
});
