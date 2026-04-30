// ? Importaciones
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import packageJson from '../../../package.json';
import DarkMode from '@/Components/UI/DarkMode';
import { establecerIdioma, seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { languageNames } from '@/i18n/translations';

export default function Header() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);

	return (
		<header className='bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6 transition-colors duration-300'>
			<nav className='container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center'>
				<section className='flex items-center gap-3 flex-1 min-w-0'>
					<motion.div
						initial={{ rotate: 0 }}
						animate={{ rotate: 360 }}
						transition={{ duration: 0.8, ease: 'easeInOut' }}
						className='bg-gradient-to-r from-indigo-500 to-purple-600 p-2 sm:p-2.5 rounded-lg text-white shadow-lg flex-none'>
						<i className='fa-solid fa-list-check text-lg sm:text-xl'></i>
					</motion.div>
					<motion.h1
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.5 }}
						className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate'>
						XestorDe
						<span className='bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent font-extrabold'>
							Tarefas
						</span>
						<span className='text-xs text-gray-500 dark:text-gray-400 ml-2'>v{packageJson.version}</span>
					</motion.h1>
				</section>
				<div className='flex items-center gap-2 sm:gap-4'>
					<div className='relative'>
						<div className='pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-500 dark:text-gray-300'>
							<i className='fa-solid fa-language text-sm'></i>
						</div>
						<select
							value={idioma}
							onChange={(e) => dispatch(establecerIdioma(e.target.value))}
							className='bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500'>
							<option value='gl'>{languageNames.gl}</option>
							<option value='es'>{languageNames.es}</option>
							<option value='en'>{languageNames.en}</option>
						</select>
					</div>
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='relative z-10'>
						<DarkMode />
					</motion.div>
				</div>
			</nav>
		</header>
	);
};

