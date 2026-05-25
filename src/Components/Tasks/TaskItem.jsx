// ? Importaciones
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// ? Features
import { alternarEstadoTarea, eliminarTarea, actualizarTarea } from '@/Features/Tasks/tareasSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';
import { seleccionarUsuarioActualId, seleccionarUsuarios } from '@/Features/Users/usuariosSlice';
import { seleccionarProxectos } from '@/Features/Projects/proxectosSlice';

const corHexARgba = (hex, alpha = 1) => {
	const safeHex = typeof hex === 'string' ? hex.trim().replace('#', '') : '';
	if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) return `rgba(147, 51, 234, ${alpha})`;
	const r = Number.parseInt(safeHex.slice(0, 2), 16);
	const g = Number.parseInt(safeHex.slice(2, 4), 16);
	const b = Number.parseInt(safeHex.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ElementoTarea = ({ tarea }) => {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActualId = useSelector(seleccionarUsuarioActualId);
	const usuarios = useSelector(seleccionarUsuarios);
	const proxectos = useSelector(seleccionarProxectos);
	const outrosUsuarios = usuarios.filter((u) => u.id !== usuarioActualId);
	const t = translations[idioma] || translations.gl;
	const [mostrarAcciones, setMostrarAcciones] = useState(false);
	const [estaEditando, setEstaEditando] = useState(false);
	const [tareaEditada, setTareaEditada] = useState(tarea);

	// Prioridades con iconos y colores
	const prioridades = {
		alta: {
			label: t.high,
			icon: 'fa-solid fa-arrow-up',
			class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
		},
		media: {
			label: t.medium,
			icon: 'fa-solid fa-equals',
			class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
		},
		baja: {
			label: t.low,
			icon: 'fa-solid fa-arrow-down',
			class: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
		},
	};

	const prioridad = prioridades[tarea.prioridad] || prioridades.media;
	const asignadaA = usuarios.find((u) => u.id === tarea.asignadaAId);
	const colaborador = (tarea.compartidaConIds || [])
		.map((id) => usuarios.find((u) => u.id === id))
		.find(Boolean);
	const proxectoVinculado = proxectos.find((p) => p.id === tarea.proxectoId);

	// Formato de data máis lexible para Galicia
	const formatearFecha = (cadenaFecha) => {
		if (!cadenaFecha) return '';
		const fecha = new Date(cadenaFecha);
		const opciones = {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'Europe/Madrid',
		};
		const locale = idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'gl-ES';
		return fecha.toLocaleDateString(locale, opciones);
	};

	// Manejar la edición de la tarea
	const manejarEdicion = () => {
		if (!tareaEditada.titulo.trim()) return;

		const tareaActualizada = {
			id: tarea.id,
			usuarioId: usuarioActualId,
			...tareaEditada,
			titulo: tareaEditada.titulo.trim(),
			descripcion: tareaEditada.descripcion?.trim() || '',
			proxectoId: tareaEditada.proxectoId || null,
			fechaVencimiento: tareaEditada.fechaVencimiento || null, // Aseguramos que fechaVencimiento sea null si no hay fecha
		};

		dispatch(actualizarTarea(tareaActualizada));
		setEstaEditando(false);
	};

	if (estaEditando) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				className='p-4 bg-gradient-to-br from-gray-50 to-neutral-100 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm'>
				<div className='space-y-4'>
					<input
						type='text'
						value={tareaEditada.titulo}
						onChange={(e) => setTareaEditada({ ...tareaEditada, titulo: e.target.value })}
						className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors text-gray-800 dark:text-white'
						placeholder={t.taskTitlePlaceholder}
					/>
					<textarea
						value={tareaEditada.descripcion || ''}
						onChange={(e) => setTareaEditada({ ...tareaEditada, descripcion: e.target.value })}
						className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors text-gray-800 dark:text-white resize-none'
						placeholder={t.taskDescriptionPlaceholder}
						rows='2'
					/>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							<i className='fa-solid fa-folder-tree mr-2 text-indigo-500 dark:text-indigo-400'></i>
							{t.taskProject}
						</label>
						<select
							value={tareaEditada.proxectoId || ''}
							onChange={(e) =>
								setTareaEditada({ ...tareaEditada, proxectoId: e.target.value || null })
							}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-800 dark:text-white'>
							<option value=''>{t.noneProject}</option>
							{proxectos.map((p) => (
								<option key={p.id} value={p.id}>
									{p.nome}
								</option>
							))}
						</select>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								<i className='fa-solid fa-flag mr-2 text-indigo-500 dark:text-indigo-400'></i>
								{t.priority}
							</label>
							<div className='flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
								{['alta', 'media', 'baja'].map((prioridad) => (
									<label
										key={prioridad}
										className={`flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer transition-colors text-sm
                                            ${
												tareaEditada.prioridad === prioridad
													? 'bg-indigo-500 text-white'
													: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
											}`}>
										<input
											type='radio'
											name='prioridad'
											value={prioridad}
											checked={tareaEditada.prioridad === prioridad}
											onChange={(e) =>
												setTareaEditada({ ...tareaEditada, prioridad: e.target.value })
											}
											className='sr-only'
										/>
										<i className={`fa-solid ${prioridades[prioridad].icon}`}></i>
										<span className='hidden sm:inline capitalize'>
											{prioridades[prioridad].label}
										</span>
									</label>
								))}
							</div>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								<i className='fa-solid fa-calendar-days mr-2 text-indigo-500 dark:text-indigo-400'></i>
								{t.dueDate}
							</label>
							<input
								type='date'
								value={tareaEditada.fechaVencimiento || ''} // Aseguramos que sea string vacío si es null
								onChange={(e) =>
									setTareaEditada({
										...tareaEditada,
										fechaVencimiento: e.target.value || null, // Si está vacío, guardamos null
									})
								}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors text-gray-800 dark:text-white'
							/>
						</div>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								<i className='fa-solid fa-user-check mr-2 text-indigo-500 dark:text-indigo-400'></i>
								{t.assignTo}
							</label>
							<select
								value={tareaEditada.asignadaAId || usuarioActualId}
								onChange={(e) => setTareaEditada({ ...tareaEditada, asignadaAId: e.target.value })}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-800 dark:text-white'>
								{usuarios.map((usuario) => (
									<option key={usuario.id} value={usuario.id}>
										{usuario.nome}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								<i className='fa-solid fa-users mr-2 text-indigo-500 dark:text-indigo-400'></i>
								{t.sharedWith}
							</label>
							<select
								value={tareaEditada.compartidaConIds?.[0] || ''}
								onChange={(e) =>
									setTareaEditada({
										...tareaEditada,
										compartidaConIds: e.target.value ? [e.target.value] : [],
									})
								}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-800 dark:text-white'>
								<option value=''>{t.none}</option>
								{outrosUsuarios.map((usuario) => (
									<option key={usuario.id} value={usuario.id}>
										{usuario.nome}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className='flex justify-end gap-2 pt-2'>
						<motion.button
							type='button'
							onClick={() => setEstaEditando(false)}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm'>
							{t.cancel}
						</motion.button>
						<motion.button
							type='button'
							onClick={manejarEdicion}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
							{t.saveChanges}
						</motion.button>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			layout
			className={`bg-gradient-to-br from-gray-50 to-neutral-100 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden
				${
					tarea.completada
						? 'border-l-4 border-green-500 dark:border-green-600'
						: 'border-l-4 border-indigo-500 dark:border-indigo-600'
				}`}
			onMouseEnter={() => setMostrarAcciones(true)}
			onMouseLeave={() => setMostrarAcciones(false)}
			onTouchStart={() => setMostrarAcciones(true)}>
			<div className='p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4'>
				<div className='flex-none'>
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => dispatch(alternarEstadoTarea({ id: tarea.id, usuarioId: usuarioActualId }))}
						className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
						${
							tarea.completada
								? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
								: 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
						}`}>
						{tarea.completada && <i className='fa-solid fa-check text-white text-xs'></i>}
					</motion.button>
				</div>

				<div
					className='flex-1 min-w-0'
					onClick={() => dispatch(alternarEstadoTarea({ id: tarea.id, usuarioId: usuarioActualId }))}>
					<h3
						className={`text-base sm:text-lg font-medium mb-1 text-gray-800 dark:text-white truncate
						${tarea.completada ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
						{tarea.titulo}
					</h3>
					{tarea.descripcion && (
						<p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2'>
							{tarea.descripcion}
						</p>
					)}
					<div className='flex flex-wrap items-center gap-2 text-sm'>
						{tarea.fechaVencimiento && (
							<span className='inline-flex items-center text-xs text-gray-500 dark:text-gray-400'>
								<i className='fa-regular fa-calendar mr-1'></i>
								{formatearFecha(tarea.fechaVencimiento)}
							</span>
						)}

						<span
							className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${prioridad.class}`}>
							<i className={`${prioridad.icon} mr-1`}></i>
							{prioridad.label}
						</span>
						{asignadaA && (
							<span className='inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'>
								<i className='fa-solid fa-user-check mr-1'></i>
								{t.assignedToLabel}: {asignadaA.nome}
							</span>
						)}
						{colaborador && (
							<span className='inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'>
								<i className='fa-solid fa-users mr-1'></i>
								{t.sharedWithLabel}: {colaborador.nome}
							</span>
						)}
						{proxectoVinculado && (
							<span
								className='inline-flex items-center text-xs px-2.5 py-1 rounded-full'
								style={{
									backgroundColor: corHexARgba(proxectoVinculado.cor, 0.16),
									color: proxectoVinculado.cor || '#9333ea',
								}}>
								<i className='fa-solid fa-folder-tree mr-1'></i>
								{t.taskProject}: {proxectoVinculado.nome}
							</span>
						)}
					</div>
				</div>
				<motion.div
					className='flex gap-2 self-end sm:self-center'
					initial={{ opacity: 0 }}
					animate={{ opacity: mostrarAcciones ? 1 : 0 }}>
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => {
							setTareaEditada({
								...tarea,
								proxectoId: tarea.proxectoId || '',
								asignadaAId: tarea.asignadaAId || usuarioActualId,
								compartidaConIds: Array.isArray(tarea.compartidaConIds) ? tarea.compartidaConIds : [],
							});
							setEstaEditando(true);
						}}
						className='w-8 h-8 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors'
						aria-label={t.editTask}>
						<i className='fa-solid fa-pen-to-square'></i>
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.1, color: '#ef4444' }}
						whileTap={{ scale: 0.9 }}
						onClick={() => dispatch(eliminarTarea({ id: tarea.id, usuarioId: usuarioActualId }))}
						className='w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
						aria-label={t.deleteTask}>
						<i className='fa-solid fa-trash-can'></i>
					</motion.button>
				</motion.div>
			</div>
		</motion.div>
	);
};

export default ElementoTarea;
