import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BarraLateral = () => {
	const [estaAbierto, setEstaAbierto] = useState(false);

	// Opciones de navegación con iconos modernos de FontAwesome 6
	const opcionesNavegacion = [
		{ icon: 'fa-house', label: 'Inicio', activo: true, URL: '/', proximamente: false },
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
							opcionesNavegacion={opcionesNavegacion}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Sidebar para escritorio */}
			<aside className='hidden md:block w-fit bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 self-start sticky top-4 hover:shadow-lg'>
				<ContenidoBarraLateral opcionesNavegacion={opcionesNavegacion} />
			</aside>
		</>
	);
};

// Componente para el contenido del sidebar
const ContenidoBarraLateral = ({ opcionesNavegacion }) => {
	return (
		<div className='space-y-8 w-fit'>
			<div className='text-center border-b border-gray-200 dark:border-gray-700 pb-6'>
				<motion.div
					whileHover={{ scale: 1.05 }}
					className='relative w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full p-1 shadow-lg'>
					<div className='absolute inset-0 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center m-0.5'>
						<i className='fa-solid fa-user-astronaut text-3xl text-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text'></i>
					</div>
				</motion.div>
				<h2 className='mt-3 font-bold text-gray-800 dark:text-white text-xl'>Persoa usuaria</h2>
				<p className='text-sm text-gray-500 dark:text-gray-400'>Benvida a XestorDeTarefas</p>
			</div>

			<nav className='px-2'>
				<ul className='space-y-1'>
					{opcionesNavegacion.map((opcion, indice) => (
						<motion.li
							key={indice}
							whileHover={{ x: 4 }}
							transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
							<a
								href={opcion.URL}
								className={`flex items-center px-4 py-3 rounded-xl transition-all ${
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
										En breve
									</span>
								)}
								{opcion.active && (
									<div className='ml-auto'>
										<i className='fa-solid fa-chevron-right text-xs opacity-70'></i>
									</div>
								)}
							</a>
						</motion.li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default BarraLateral;
