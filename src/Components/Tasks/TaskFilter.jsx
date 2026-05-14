// ? Importaciones
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';

// ? Features
import {
	seleccionarConteoTareas,
	seleccionarFiltroActivo,
	establecerFiltro,
	establecerBusqueda,
	establecerOrdenamiento,
} from '@/Features/Tasks/tareasSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';

const FiltroTareas = () => {
	const dispatch = useDispatch();
	const filtroActivo = useSelector(seleccionarFiltroActivo);
	const conteoTareas = useSelector(seleccionarConteoTareas);
	const idioma = useSelector(seleccionarIdioma);
	const t = translations[idioma] || translations.gl;
	const [terminoBusqueda, setTerminoBusqueda] = useState('');
	const [estaAbierto, setEstaAbierto] = useState(false);

	// Opciones de filtro con sus iconos
	const opcionesFiltro = [
		{ id: 'todos', label: t.all, icon: 'fa-border-all' },
		{ id: 'activas', label: t.active, icon: 'fa-hourglass-half' },
		{ id: 'completadas', label: t.completed, icon: 'fa-check-circle' },
		// Opciones adicionales de prioridad
		{ id: 'alta', label: t.priorityHigh, icon: 'fa-arrow-up' },
		{ id: 'media', label: t.priorityMedium, icon: 'fa-equals' },
		{ id: 'baja', label: t.priorityLow, icon: 'fa-arrow-down' },
	];

	// Cambiar el filtro activo
	const manejarCambioFiltro = (idFiltro) => {
		dispatch(establecerFiltro(idFiltro));
	};

	// Cambiar el término de búsqueda
	const manejarCambioBusqueda = (e) => {
		const valor = e.target.value;
		setTerminoBusqueda(valor);
		dispatch(establecerBusqueda(valor));
	};

	// Cambiar el orden de las tareas
	const manejarCambioOrdenamiento = (e) => {
		dispatch(establecerOrdenamiento(e.target.value));
	};

	return (
		<div className='mb-6'>
			<div className='bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-4 sm:p-5 transition-all duration-300'>
				<div className='flex flex-col lg:flex-row justify-between gap-4'>
					{/* Búsqueda */}
					<div className='relative flex-1 min-w-0'>
						<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500'>
							<i className='fa-solid fa-search'></i>
						</div>
						<input
							type='text'
							value={terminoBusqueda}
							onChange={manejarCambioBusqueda}
							placeholder={t.searchTasks}
							className='w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors text-gray-800 dark:text-white'
						/>
					</div>

					{/* Ordenar */}
					<div className='relative flex-initial w-full lg:w-48'>
						<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500'>
							<i className='fa-solid fa-sort'></i>
						</div>
						<select
							onChange={manejarCambioOrdenamiento}
							defaultValue='fechaCreacion:desc'
							className='w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors text-gray-800 dark:text-white appearance-none cursor-pointer'>
							<option value='fechaCreacion:desc'>{t.mostRecent}</option>
							<option value='fechaCreacion:asc'>{t.oldest}</option>
							<option value='fechaVencimiento:asc'>{t.dueDateUp}</option>
							<option value='fechaVencimiento:desc'>{t.dueDateDown}</option>
							<option value='prioridad:asc'>{t.priorityUp}</option>
							<option value='prioridad:desc'>{t.priorityDown}</option>
						</select>
						<div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 dark:text-gray-500'>
							<i className='fa-solid fa-chevron-down'></i>
						</div>
					</div>
				</div>

				{/* Filtros de pestañas */}
				<div className='mt-5 relative'>
					{/* Versión móvil - Menú desplegable */}
					<div className='md:hidden'>
						<button
							onClick={() => setEstaAbierto(!estaAbierto)}
							className='w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'>
							<div className='flex items-center gap-2'>
								<i
									className={`fa-solid ${
										opcionesFiltro.find((opt) => opt.id === filtroActivo)?.icon
									}`}></i>
								<span>{opcionesFiltro.find((opt) => opt.id === filtroActivo)?.label}</span>
							</div>
							<i
								className={`fa-solid ${
									estaAbierto ? 'fa-chevron-up' : 'fa-chevron-down'
								} text-sm opacity-70`}></i>
						</button>

						{estaAbierto && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className='absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'>
								{opcionesFiltro.map((opcion) => (
									<button
										key={opcion.id}
										onClick={() => {
											manejarCambioFiltro(opcion.id);
											setEstaAbierto(false);
										}}
										className={`w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
											${
												filtroActivo === opcion.id
													? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
													: 'text-gray-700 dark:text-gray-300'
											}`}>
										<div className='flex items-center gap-2'>
											<i className={`fa-solid ${opcion.icon}`}></i>
											<span>{opcion.label}</span>
										</div>
										<span className='inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'>
											{conteoTareas[opcion.id] || 0}
										</span>
									</button>
								))}
							</motion.div>
						)}
					</div>

					{/* Versión escritorio — dúas filas (3 columnas) para que quepan sen scroll horizontal */}
					<div className='hidden md:grid md:grid-cols-3 gap-2'>
						{opcionesFiltro.map((opcion) => (
							<motion.button
								key={opcion.id}
								onClick={() => manejarCambioFiltro(opcion.id)}
								className={`px-2 sm:px-3 py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm font-medium transition-colors rounded-lg border-2
									${
										filtroActivo === opcion.id
											? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/25 text-indigo-600 dark:text-indigo-400'
											: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
									}`}
								whileHover={{ y: -2 }}
								whileTap={{ y: 0 }}>
								<span className='inline-flex items-center gap-2'>
									<i className={`fa-solid ${opcion.icon} shrink-0`}></i>
									<span className='leading-tight'>{opcion.label}</span>
								</span>
								<motion.span
									className='inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: 'spring', stiffness: 500, damping: 10 }}>
									{conteoTareas[opcion.id] || 0}
								</motion.span>
							</motion.button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default FiltroTareas;
