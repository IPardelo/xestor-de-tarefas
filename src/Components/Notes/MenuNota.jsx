import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function MenuNota({ fixada, onEditar, onFixar, onEliminar, onAbrirCambio, t }) {
	const [aberto, setAberto] = useState(false);
	const ref = useRef(null);

	const cambiar = (valor) => {
		setAberto(valor);
		onAbrirCambio?.(valor);
	};

	useEffect(() => {
		if (!aberto) return undefined;
		const pecharFora = (e) => {
			if (ref.current && !ref.current.contains(e.target)) cambiar(false);
		};
		const pecharEscape = (e) => {
			if (e.key === 'Escape') cambiar(false);
		};
		document.addEventListener('pointerdown', pecharFora);
		document.addEventListener('keydown', pecharEscape);
		return () => {
			document.removeEventListener('pointerdown', pecharFora);
			document.removeEventListener('keydown', pecharEscape);
		};
	}, [aberto]);

	const escoller = (accion) => () => {
		cambiar(false);
		accion();
	};

	const claseOpcion =
		'w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors';

	return (
		<div ref={ref} className='relative shrink-0'>
			<button
				type='button'
				onClick={() => cambiar(!aberto)}
				aria-haspopup='menu'
				aria-expanded={aberto}
				aria-label={t.noteOptions}
				title={t.noteOptions}
				className='w-8 h-8 -mr-2 -mt-1 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors'>
				<i className='fa-solid fa-ellipsis-vertical'></i>
			</button>
			<AnimatePresence>
				{aberto && (
					<motion.div
						role='menu'
						initial={{ opacity: 0, scale: 0.95, y: -4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -4 }}
						transition={{ duration: 0.12 }}
						style={{ transformOrigin: 'top right' }}
						className='absolute right-0 top-full mt-1 z-30 min-w-36 py-1.5 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'>
						<button type='button' role='menuitem' onClick={escoller(onEditar)} className={claseOpcion}>
							{t.noteMenuEdit}
						</button>
						<button type='button' role='menuitem' onClick={escoller(onFixar)} className={claseOpcion}>
							{fixada ? t.unpinNote : t.pinNote}
						</button>
						<div className='my-1.5 mx-3 border-t border-gray-200 dark:border-gray-700' />
						<button
							type='button'
							role='menuitem'
							onClick={escoller(onEliminar)}
							className={`${claseOpcion} hover:text-red-600 dark:hover:text-red-400`}>
							{t.noteMenuDelete}
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
