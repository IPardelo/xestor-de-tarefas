import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';

// Componentes
import TaskList from '@/Components/Tasks/TasksList';
import TaskForm from '@/Components/Tasks/TaskForm';
import Header from '@/Components/Layout/Header';
import Sidebar from '@/Components/Layout/Sidebar';
import TaskFilter from '@/Components/Tasks/TaskFilter';
import CalendarView from '@/Components/Calendar/CalendarView';
import OptionsUsersView from '@/Components/Options/OptionsUsersView';
import OptionsGlobalView from '@/Components/Options/OptionsGlobalView';
import ProjectsView from '@/Components/Projects/ProjectsView';
import UserSettingsView from '@/Components/Layout/UserSettingsView';

// Features
import { establecerIdioma, seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { establecerTema, seleccionarTema } from '@/Features/Theme/temaSlice';
import { limpiarTareas } from '@/Features/Tasks/tareasSlice';
import { translations } from '@/i18n/translations';
import { seleccionarUsuarioActual } from '@/Features/Users/usuariosSlice';

export default function App() {
	const dispatch = useDispatch();
	const tema = useSelector(seleccionarTema);
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActual = useSelector(seleccionarUsuarioActual);
	const t = translations[idioma] || translations.gl;
	const xenero = usuarioActual?.xenero === 'M' ? 'masculino' : 'feminino';
	const benvida = idioma === 'en' ? t.welcome : t.welcomeByGender?.[xenero] || t.welcome;
	const [vistaActual, setVistaActual] = useState('inicio');

	useEffect(() => {
		if (tema === 'oscuro') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [tema]);

	useEffect(() => {
		if (!usuarioActual) return;
		dispatch(establecerIdioma(usuarioActual.idiomaPredeterminado || 'gl'));
		dispatch(establecerTema(usuarioActual.temaPredeterminado || 'claro'));
	}, [dispatch, usuarioActual]);

	// Limpiar tareas inválidas al iniciar la aplicación
	useEffect(() => {
		dispatch(limpiarTareas());
	}, [dispatch]);

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
			<Header />
			<div className='container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 max-w-7xl'>
				<Sidebar vistaActual={vistaActual} onCambiarVista={setVistaActual} />
				<main className='flex-1 min-w-0'>
					{vistaActual === 'inicio' ? (
						<>
							<div>
								<motion.h1
									initial={{ y: -20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									transition={{ duration: 0.5 }}
									className='text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4'>
									{benvida}
								</motion.h1>
							</div>
							<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 transition-colors duration-300'>
								<div className='flex flex-col'>
									<div className='flex items-center justify-between mb-4'>
										<h1 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-white'>
											{t.addNewTask}
										</h1>
									</div>
									<TaskForm />
								</div>
							</div>
							<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
								<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
									<h2 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-white'>
										{t.myTasks}
									</h2>
								</div>
								<AnimatePresence>
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.3 }}>
										<TaskFilter />
									</motion.div>
								</AnimatePresence>
								<AnimatePresence>
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.3 }}>
										<TaskList />
									</motion.div>
								</AnimatePresence>
							</div>
						</>
					) : vistaActual === 'calendario' ? (
						<CalendarView />
					) : vistaActual === 'proxectos' ? (
						<ProjectsView />
					) : vistaActual === 'axustesUsuario' ? (
						<UserSettingsView />
					) : vistaActual === 'opcionesUsuarios' ? (
						<OptionsUsersView />
					) : vistaActual === 'opcionesGlobais' ? (
						<OptionsGlobalView />
					) : null}
				</main>
			</div>
			<div
				className='mt-6 pb-3 pl-4 select-none text-[11px] sm:text-xs font-semibold tracking-wide opacity-80 text-gray-500 dark:text-gray-400'
				style={{
					textShadow:
						'0 1px 0 rgba(255,255,255,0.35), 0 -1px 0 rgba(0,0,0,0.45), 0 0 1px rgba(0,0,0,0.35)',
				}}>
				<span className='pointer-events-none'>Desarrollado por </span>
				<a
					href='https://ipardelo.es'
					target='_blank'
					rel='noreferrer'
					className='pointer-events-auto underline decoration-dotted underline-offset-2 hover:opacity-100 transition-opacity'>
					IPardelo
				</a>
			</div>
		</div>
	);
}
