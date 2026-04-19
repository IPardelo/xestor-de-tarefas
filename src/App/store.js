import { configureStore } from '@reduxjs/toolkit';
import tareasReducer from '@/Features/Tasks/tareasSlice';

export const store = configureStore({
	reducer: {
		tareas: tareasReducer,
	},
});
