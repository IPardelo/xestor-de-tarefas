import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { seleccionarTodasLasTareas } from '@/Features/Tasks/tareasSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';
import {
	cambiarUsuario,
	seleccionarUsuarioActual,
	seleccionarUsuarioActualAdmin,
	seleccionarUsuarioActualId,
	seleccionarUsuarios,
} from '@/Features/Users/usuariosSlice';

const BarraLateral = ({ vistaActual, onCambiarVista = () => {} }) => {
	const dispatch = useDispatch();
	const tarefas = useSelector(seleccionarTodasLasTareas) || [];
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActualId = useSelector(seleccionarUsuarioActualId);
	const usuarios = useSelector(seleccionarUsuarios);
	const usuarioActual = useSelector(seleccionarUsuarioActual);
	const t = translations[idioma] || translations.gl;
	const xeneroActual = usuarioActual?.xenero === 'M' ? 'masculino' : 'feminino';
	const benvidaLateral =
		idioma === 'en' ? t.sidebarWelcome : t.sidebarWelcomeByGender?.[xeneroActual] || t.sidebarWelcome;
	const [estaAbierto, setEstaAbierto] = useState(false);

	// Filtrar tarefas válidas para evitar erros con elementos nulos
	const tarefasValidas = tarefas.filter((tarefa) => tarefa !== null && tarefa !== undefined);

	// Calcular estatísticas
	const totalTarefas = tarefasValidas.length;
	const tarefasCompletadas = tarefasValidas.filter((tarefa) => tarefa.completada).length;
	const tarefasPendentes = totalTarefas - tarefasCompletadas;
	const taxaCompletado = totalTarefas > 0 ? Math.round((tarefasCompletadas / totalTarefas) * 100) : 0;

	// Opciones de navegación con iconos modernos de FontAwesome 6
	const opcionesNavegacion = [
		{ id: 'inicio', icon: 'fa-house', label: t.home, activo: vistaActual === 'inicio', proximamente: false },
		{
			id: 'calendario',
			icon: 'fa-calendar-days',
			label: t.calendar,
			activo: vistaActual === 'calendario',
			proximamente: false,
		},
		{
			id: 'proxectos',
			icon: 'fa-folder-tree',
			label: t.projects,
			activo: vistaActual === 'proxectos',
			proximamente: false,
		},
	];

	return (
		<>
			{/* Overlay para móvil */}
			<AnimatePresence>
				{estaAbierto && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.5 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 bg-black z-10 md:hidden'
						onClick={() => setEstaAbierto(false)}
					/>
				)}
			</AnimatePresence>

			{/* Botón de menú para móvil */}
			<div className='md:hidden fixed bottom-4 right-4 z-20'>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setEstaAbierto(!estaAbierto)}
					className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg'>
					<i className={`fa-solid ${estaAbierto ? 'fa-xmark' : 'fa-bars'}`}></i>
				</motion.button>
			</div>

			{/* Sidebar para móvil */}
			<AnimatePresence>
				{estaAbierto && (
					<motion.div
						initial={{ x: '-100%' }}
						animate={{ x: 0 }}
						exit={{ x: '-100%' }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className='fixed inset-y-0 left-0 w-fit bg-white dark:bg-gray-800 shadow-2xl z-20 md:hidden p-6 overflow-y-auto'>
						<button
							onClick={() => setEstaAbierto(false)}
							className='absolute top-4 left-4 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
							<i className='fa-solid fa-xmark'></i>
						</button>
						<ContenidoBarraLateral
							vistaActual={vistaActual}
							opcionesNavegacion={opcionesNavegacion}
							totalTarefas={totalTarefas}
							tarefasCompletadas={tarefasCompletadas}
							tarefasPendentes={tarefasPendentes}
							taxaCompletado={taxaCompletado}
							t={t}
							xeneroActual={xeneroActual}
							benvidaLateral={benvidaLateral}
							usuarioActualId={usuarioActualId}
							usuarioActual={usuarioActual}
							usuarios={usuarios}
							onCambiarUsuario={(id) => dispatch(cambiarUsuario(id))}
							onCambiarVista={onCambiarVista}
							onDespuesDeNavegar={() => setEstaAbierto(false)}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Sidebar para escritorio */}
			<aside className='hidden md:block w-fit bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 self-start sticky top-4 hover:shadow-lg'>
				<ContenidoBarraLateral
					vistaActual={vistaActual}
					opcionesNavegacion={opcionesNavegacion}
					totalTarefas={totalTarefas}
					tarefasCompletadas={tarefasCompletadas}
					tarefasPendentes={tarefasPendentes}
					taxaCompletado={taxaCompletado}
					t={t}
					xeneroActual={xeneroActual}
					benvidaLateral={benvidaLateral}
					usuarioActualId={usuarioActualId}
					usuarioActual={usuarioActual}
					usuarios={usuarios}
					onCambiarUsuario={(id) => dispatch(cambiarUsuario(id))}
					onCambiarVista={onCambiarVista}
				/>
			</aside>
		</>
	);
};

// Componente para el contenido del sidebar
const ContenidoBarraLateral = ({
	vistaActual,
	opcionesNavegacion,
	totalTarefas,
	tarefasCompletadas,
	tarefasPendentes,
	taxaCompletado,
	t,
	xeneroActual,
	benvidaLateral,
	usuarioActualId,
	usuarioActual,
	usuarios,
	onCambiarUsuario,
	onCambiarVista,
	onDespuesDeNavegar,
}) => {
	const esAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const podeCambiarUsuario = usuarios.length > 1;
	const [opcionsXeraisAberto, setOpcionsXeraisAberto] = useState(false);
	const opcionsFilhoActivo =
		esAdmin &&
		(vistaActual === 'opcionesUsuarios' || vistaActual === 'opcionesGlobais');

	useEffect(() => {
		if (!esAdmin) {
			setOpcionsXeraisAberto(false);
			return;
		}
		if (vistaActual === 'opcionesUsuarios' || vistaActual === 'opcionesGlobais') {
			setOpcionsXeraisAberto(true);
		}
	}, [vistaActual, esAdmin]);

	return (
		<div className='space-y-8 w-fit'>
			<div className='text-center border-b border-gray-200 dark:border-gray-700 pb-6'>
				<motion.div
					whileHover={{ scale: 1.05 }}
					className='relative w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full p-1 shadow-lg'>
					{usuarioActual?.imaxePerfil ? (
						<img
							src={usuarioActual.imaxePerfil}
							alt='Perfil'
							className='absolute inset-0 w-full h-full rounded-full object-cover m-0.5'
						/>
					) : (
						<div className='absolute inset-0 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center m-0.5'>
							<i className='fa-solid fa-user-astronaut text-3xl text-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text'></i>
						</div>
					)}
				</motion.div>
				<div className='mt-3'>
					<div className='relative'>
						<div className='pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-500 dark:text-gray-300'>
							<i className='fa-solid fa-user text-sm'></i>
						</div>
						<select
							value={usuarioActualId}
							onChange={(e) => onCambiarUsuario(e.target.value)}
							disabled={!podeCambiarUsuario}
							className='w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500'>
							{usuarios.map((usuario) => (
								<option key={usuario.id} value={usuario.id}>
									{usuario.nome}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className='mt-2 flex items-center justify-center gap-2'>
					<p className='text-sm text-gray-500 dark:text-gray-400 flex-1 min-w-0 text-center'>{benvidaLateral}</p>
					<button
						type='button'
						onClick={() => {
							onCambiarVista('axustesUsuario');
							onDespuesDeNavegar?.();
						}}
						className={`shrink-0 p-1 rounded-lg transition-colors ${
							vistaActual === 'axustesUsuario'
								? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
								: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
						}`}
						aria-current={vistaActual === 'axustesUsuario' ? 'page' : undefined}
						aria-label={t.userSettingsLabel}
						title={t.userSettingsLabel}>
						<i className='fa-solid fa-gear text-base' />
					</button>
				</div>
			</div>

			<nav className='px-2'>
				<ul className='space-y-1'>
					{opcionesNavegacion.map((opcion, indice) => (
						<motion.li
							key={indice}
							whileHover={{ x: 4 }}
							transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
							<button
								type='button'
								onClick={() => {
									onCambiarVista(opcion.id);
									onDespuesDeNavegar?.();
								}}
								className={`w-full flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer ${
									opcion.activo
										? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md'
										: 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
								}`}>
								<i
									className={`fa-solid ${opcion.icon} text-lg ${
										opcion.activo ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
									}`}></i>
								<span className='ml-4'>{opcion.label}</span>
								{opcion.proximamente && (
									<span className='ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700/20 text-gray-400 dark:text-gray-500'>
										{t.comingSoon}
									</span>
								)}
								{opcion.active && (
									<div className='ml-auto'>
										<i className='fa-solid fa-chevron-right text-xs opacity-70'></i>
									</div>
								)}
							</button>
						</motion.li>
					))}
					{esAdmin && (
						<motion.li whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
							<button
								type='button'
								onClick={() => setOpcionsXeraisAberto((v) => !v)}
								className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer ${
									opcionsFilhoActivo
										? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md'
										: 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
								}`}
								aria-expanded={opcionsXeraisAberto}
								aria-controls='submenu-opcions-xerais'>
								<i
									className={`fa-solid fa-sliders text-lg ${
										opcionsFilhoActivo ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
									}`}
								/>
								<span className='ml-2 flex-1 text-left'>{t.optionsGeneralNav}</span>
								<i
									className={`fa-solid text-xs shrink-0 ${
										opcionsXeraisAberto ? 'fa-chevron-up' : 'fa-chevron-down'
									} ${opcionsFilhoActivo ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
								/>
							</button>
							{opcionsXeraisAberto && (
								<ul
									id='submenu-opcions-xerais'
									className='mt-1 ml-2 pl-3 border-l-2 border-indigo-200 dark:border-indigo-600 space-y-0.5'>
									<li>
										<button
											type='button'
											onClick={() => {
												onCambiarVista('opcionesUsuarios');
												onDespuesDeNavegar?.();
											}}
											className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
												vistaActual === 'opcionesUsuarios'
													? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-medium'
													: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
											}`}>
											{t.optionsUserCreationNav}
										</button>
									</li>
									<li>
										<button
											type='button'
											onClick={() => {
												onCambiarVista('opcionesGlobais');
												onDespuesDeNavegar?.();
											}}
											className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
												vistaActual === 'opcionesGlobais'
													? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-medium'
													: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
											}`}>
											{t.optionsGlobalNav}
										</button>
									</li>
								</ul>
							)}
						</motion.li>
					)}
				</ul>
			</nav>

			<div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
				<h3 className='font-bold text-gray-800 dark:text-white text-lg mb-4 flex items-center gap-2'>
					<i className='fa-solid fa-chart-pie text-indigo-500 dark:text-indigo-400'></i>
					{t.taskSummary}
				</h3>

				<div className='space-y-5'>
					<div>
						<div className='flex justify-between text-sm mb-2'>
							<span className='text-gray-600 dark:text-gray-400 font-medium'>{t.progress}</span>
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								key={taxaCompletado}
								className='font-bold text-indigo-600 dark:text-indigo-400'>
								{taxaCompletado}%
							</motion.span>
						</div>
						<div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5'>
							<motion.div
								className='bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full'
								initial={{ width: 0 }}
								animate={{ width: `${taxaCompletado}%` }}
								transition={{ duration: 0.8, ease: 'easeOut' }}></motion.div>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<motion.div
							whileHover={{ y: -4 }}
							transition={{ type: 'spring', stiffness: 400, damping: 10 }}
							className='bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl shadow-sm'>
							<div className='flex justify-between items-center gap-2'>
								<p className='text-xs font-medium text-gray-600 dark:text-gray-400'>{t.completed}</p>
								<div className='p-2 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/20'>
									<i className='fa-solid fa-check text-xs text-green-500 dark:text-green-400'></i>
								</div>
							</div>
							<p className='text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2'>
								{tarefasCompletadas}
							</p>
						</motion.div>

						<motion.div
							whileHover={{ y: -4 }}
							transition={{ type: 'spring', stiffness: 400, damping: 10 }}
							className='bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl shadow-sm'>
							<div className='flex justify-between items-center gap-2'>
								<p className='text-xs font-medium text-gray-600 dark:text-gray-400'>{t.pending}</p>
								<div className='p-2 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/20'>
									<i className='fa-solid fa-clock text-xs text-amber-500 dark:text-amber-400'></i>
								</div>
							</div>
							<p className='text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2'>
								{tarefasPendentes}
							</p>
						</motion.div>
					</div>

					<motion.div
						whileHover={{ y: -4 }}
						transition={{ type: 'spring', stiffness: 400, damping: 10 }}
						className='bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl shadow-sm'>
						<div className='flex justify-between items-center'>
							<p className='text-xs font-medium text-gray-600 dark:text-gray-400'>{t.totalTasks}</p>
							<div className='p-2 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20'>
								<i className='fa-solid fa-list-check text-xs text-blue-500 dark:text-blue-400'></i>
							</div>
						</div>
						<p className='text-2xl font-bold text-gray-800 dark:text-white mt-2'>{totalTarefas}</p>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default BarraLateral;
