// ? Importaciones
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

// ? Store
import { store } from '@/App/store';
import { cargarDatosApp, gardarDatosApp, subscribirseADatosRemotos } from '@/App/persistence';
import { hidratarTareas } from '@/Features/Tasks/tareasSlice';
import { hidratarTema } from '@/Features/Theme/temaSlice';
import { hidratarIdioma } from '@/Features/Language/idiomaSlice';
import { hidratarUsuarios } from '@/Features/Users/usuariosSlice';
import { hidratarProxectos } from '@/Features/Projects/proxectosSlice';
import { hidratarNotas } from '@/Features/Notes/notasSlice';

// ? Estilos
import '@/index.css';

// ? Iconos FontAwesome v6
import '@/Assets/FontAwesome/css/all.min.css';

// ? Componentes
import App from '@/App.jsx';

async function bootstrap() {
	let remoteSnapshotHash = null;
	let hydratedFromRemote = false;

	const aplicarHidratacion = (data) => {
		if (!data) return;
		if (data?.usuarios) store.dispatch(hidratarUsuarios(data.usuarios));
		if (data?.idioma) store.dispatch(hidratarIdioma(data.idioma));
		if (data?.tema) store.dispatch(hidratarTema(data.tema));
		if (data?.tareas) store.dispatch(hidratarTareas(data.tareas));
		if (data?.proxectos) store.dispatch(hidratarProxectos(data.proxectos));
		if (data?.notas) store.dispatch(hidratarNotas(data.notas));
	};

	const getSerializableState = () => {
		const state = store.getState();
		return {
			usuarios: state.usuarios,
			idioma: state.idioma,
			tema: state.tema,
			tareas: state.tareas,
			proxectos: state.proxectos,
			notas: state.notas,
		};
	};

	const getHash = (value) => JSON.stringify(value);

	try {
		const data = await cargarDatosApp();
		if (data) {
			aplicarHidratacion(data);
			remoteSnapshotHash = getHash(data);
		}
	} catch (error) {
		console.error('Non se puideron cargar os datos de Firebase:', error);
	}

	let timeoutId;
	store.subscribe(() => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			if (hydratedFromRemote) {
				hydratedFromRemote = false;
				return;
			}

			const dataToSave = getSerializableState();
			const nextHash = getHash(dataToSave);
			if (nextHash === remoteSnapshotHash) return;

			gardarDatosApp(dataToSave)
				.then(() => {
					remoteSnapshotHash = nextHash;
				})
				.catch((error) => {
					console.error('Erro ao gardar datos en Firebase:', error);
				});
		}, 200);
	});

	subscribirseADatosRemotos(
		(data) => {
			const incomingHash = getHash(data);
			if (incomingHash === remoteSnapshotHash) return;
			hydratedFromRemote = true;
			remoteSnapshotHash = incomingHash;
			aplicarHidratacion(data);
		},
		(error) => {
			console.error('Erro na sincronizacion remota con Firebase:', error);
		}
	);

	ReactDOM.createRoot(document.getElementById('root')).render(
		<React.StrictMode>
			<Provider store={store}>
				<App />
			</Provider>
		</React.StrictMode>
	);
}

bootstrap();
