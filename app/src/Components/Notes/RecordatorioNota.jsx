import { dataRecordatorio } from '@/Utils/recordatorios';

const localePorIdioma = { gl: 'gl-ES', es: 'es-ES', en: 'en-GB' };

const dentroDunhaHora = () => {
	const d = new Date(Date.now() + 60 * 60 * 1000);
	d.setMinutes(0, 0, 0);
	const p = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function CampoRecordatorio({ valor, onChange, t }) {
	if (!valor) {
		return (
			<button
				type='button'
				onClick={() => onChange(dentroDunhaHora())}
				className='inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'>
				<i className='fa-regular fa-bell'></i>
				{t.noteAddReminder}
			</button>
		);
	}
	return (
		<div className='flex items-center gap-2'>
			<i className='fa-solid fa-bell text-indigo-500 dark:text-indigo-400' aria-hidden='true'></i>
			<input
				type='datetime-local'
				value={valor}
				onChange={(e) => onChange(e.target.value)}
				aria-label={t.noteReminder}
				className='flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500'
			/>
			<button
				type='button'
				onClick={() => onChange('')}
				title={t.noteRemoveReminder}
				aria-label={t.noteRemoveReminder}
				className='w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors'>
				<i className='fa-solid fa-xmark'></i>
			</button>
		</div>
	);
}

export function EtiquetaRecordatorio({ nota, idioma, t }) {
	const data = dataRecordatorio(nota);
	if (!data) return null;
	const pasado = data.getTime() <= Date.now();
	const texto = new Intl.DateTimeFormat(localePorIdioma[idioma] || 'gl-ES', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(data);
	return (
		<span
			title={pasado ? t.noteReminderPast : t.noteReminder}
			className={`mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 ${
				pasado ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'
			}`}>
			<i className={`fa-${pasado ? 'regular' : 'solid'} fa-bell`}></i>
			{texto}
		</span>
	);
}
