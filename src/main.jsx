// ? Importaciones
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

// ? Store
import { store } from '@/App/store';
import { cargarDatosApp, gardarDatosApp } from '@/App/persistence';
import { hidratarTareas } from '@/Features/Tasks/tareasSlice';
import { hidratarTema } from '@/Features/Theme/temaSlice';
import { hidratarIdioma } from '@/Features/Language/idiomaSlice';
import { hidratarUsuarios } from '@/Features/Users/usuariosSlice';

// ? Estilos
import '@/index.css';

// ? Iconos FontAwesome v6
import '@/Assets/FontAwesome/css/all.min.css';

// ? Componentes
import App from '@/App.jsx';

async function bootstrap() {
	try {
		const data = await cargarDatosApp();
		if (data?.usuarios) store.dispatch(hidratarUsuarios(data.usuarios));
		if (data?.idioma) store.dispatch(hidratarIdioma(data.idioma));
		if (data?.tema) store.dispatch(hidratarTema(data.tema));
		if (data?.tareas) store.dispatch(hidratarTareas(data.tareas));
	} catch (error) {
		console.error('Non se puideron cargar os datos do ficheiro JSON:', error);
	}

	let timeoutId;
	store.subscribe(() => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			const state = store.getState();
			gardarDatosApp({
				usuarios: state.usuarios,
				idioma: state.idioma,
				tema: state.tema,
				tareas: state.tareas,
			}).catch((error) => {
				console.error('Erro ao gardar datos no JSON:', error);
			});
		}, 200);
	});

	ReactDOM.createRoot(document.getElementById('root')).render(
		<React.StrictMode>
			<Provider store={store}>
				<App />
			</Provider>
		</React.StrictMode>
	);
}

bootstrap();
