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

// Features
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { seleccionarTema } from '@/Features/Theme/temaSlice';
import { limpiarTareas } from '@/Features/Tasks/tareasSlice';
import { translations } from '@/i18n/translations';

export default function App() {
	const dispatch = useDispatch();
	const tema = useSelector(seleccionarTema);
	const idioma = useSelector(seleccionarIdioma);
	const t = translations[idioma] || translations.gl;
	const [vistaActual, setVistaActual] = useState('inicio');

	useEffect(() => {
		if (tema === 'oscuro') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [tema]);

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
									{t.welcome}
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
					) : (
						<CalendarView />
					)}
				</main>
			</div>
		</div>
	);
}
