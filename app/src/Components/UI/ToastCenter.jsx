import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ToastCenter() {
	const [toasts, setToasts] = useState([]);

	useEffect(() => {
		const onToast = (event) => {
			const id = Date.now() + Math.random();
			const message = event.detail?.message;
			const type = event.detail?.type || 'success';
			if (!message) return;
			setToasts((prev) => [...prev, { id, message, type }]);
			window.setTimeout(() => {
				setToasts((prev) => prev.filter((toast) => toast.id !== id));
			}, 2500);
		};

		window.addEventListener('app:toast', onToast);
		return () => window.removeEventListener('app:toast', onToast);
	}, []);

	return (
		<div className='fixed top-4 right-4 z-[100] space-y-2 pointer-events-none'>
			<AnimatePresence>
				{toasts.map((toast) => (
					<motion.div
						key={toast.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
							toast.type === 'error'
								? 'bg-red-600 text-white'
								: 'bg-emerald-600 text-white'
						}`}>
						{toast.message}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
