import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { seleccionarTodasLasTareas } from '@/Features/Tasks/tareasSlice';
import { seleccionarProxectos } from '@/Features/Projects/proxectosSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';

const localeByLang = {
	gl: 'gl-ES',
	es: 'es-ES',
	en: 'en-US',
};

const weekStartByLang = {
	gl: 1, // Monday
	es: 1, // Monday
	en: 0, // Sunday
};

const corHexARgba = (hex, alpha = 1) => {
	const safeHex = typeof hex === 'string' ? hex.trim().replace('#', '') : '';
	if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) return `rgba(147, 51, 234, ${alpha})`;
	const r = Number.parseInt(safeHex.slice(0, 2), 16);
	const g = Number.parseInt(safeHex.slice(2, 4), 16);
	const b = Number.parseInt(safeHex.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function getMonthName(date, locale) {
	return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}

function normalizeDate(dateString) {
	if (!dateString) return null;
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return null;
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMonthGrid(year, month, weekStart) {
	const firstDay = new Date(year, month, 1);
	const startOffset = (firstDay.getDay() - weekStart + 7) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const cells = [];
	for (let i = 0; i < startOffset; i += 1) cells.push(null);
	for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
	while (cells.length % 7 !== 0) cells.push(null);
	return cells;
}

export default function CalendarView() {
	const idioma = useSelector(seleccionarIdioma);
	const tarefas = useSelector(seleccionarTodasLasTareas) || [];
	const proxectos = useSelector(seleccionarProxectos);
	const t = translations[idioma] || translations.gl;
	const locale = localeByLang[idioma] || localeByLang.gl;
	const weekStart = weekStartByLang[idioma] ?? weekStartByLang.gl;
	const monthNames = useMemo(() => {
		if (Array.isArray(t.monthsLong) && t.monthsLong.length === 12) {
			return t.monthsLong;
		}
		return [...Array(12)].map((_, monthIndex) =>
			getMonthName(new Date(2026, monthIndex, 1), locale)
		);
	}, [t.monthsLong, locale]);

	const now = new Date();
	const [selectedYear, setSelectedYear] = useState(now.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState(null);

	const tarefasConData = useMemo(
		() =>
			tarefas
				.filter((tarefa) => tarefa && tarefa.fechaVencimiento)
				.map((tarefa) => ({ ...tarefa, _dueDate: normalizeDate(tarefa.fechaVencimiento) }))
				.filter((tarefa) => tarefa._dueDate),
		[tarefas]
	);

	const tareasPorMes = useMemo(() => {
		const map = new Map();
		tarefasConData.forEach((tarefa) => {
			const key = `${tarefa._dueDate.getFullYear()}-${tarefa._dueDate.getMonth()}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(tarefa);
		});
		return map;
	}, [tarefasConData]);

	const weekdayHeaders = useMemo(() => {
		if (Array.isArray(t.weekdaysShort) && t.weekdaysShort.length === 7) {
			return t.weekdaysShort;
		}
		const base = weekStart === 0 ? new Date(2026, 0, 4) : new Date(2026, 0, 5);
		return [...Array(7)].map((_, i) =>
			new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
				new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
			)
		);
	}, [locale, weekStart, t.weekdaysShort]);

	if (selectedMonth === null) {
		return (
			<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
				<div className='flex items-center justify-between mb-6'>
					<h2 className='text-xl font-semibold text-gray-800 dark:text-white'>{t.calendarYearTitle}</h2>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={() => setSelectedYear((y) => y - 1)}
							className='px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'>
							<i className='fa-solid fa-chevron-left'></i>
						</button>
						<span className='font-bold text-gray-800 dark:text-white min-w-16 text-center'>{selectedYear}</span>
						<button
							type='button'
							onClick={() => setSelectedYear((y) => y + 1)}
							className='px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'>
							<i className='fa-solid fa-chevron-right'></i>
						</button>
					</div>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
					{[...Array(12)].map((_, month) => {
						const monthDate = new Date(selectedYear, month, 1);
						const monthName = monthNames[month] || getMonthName(monthDate, locale);
						const grid = getMonthGrid(selectedYear, month, weekStart);
						const tasksCount = (tareasPorMes.get(`${selectedYear}-${month}`) || []).length;

						return (
							<motion.button
								type='button'
								key={month}
								whileHover={{ y: -2 }}
								onClick={() => setSelectedMonth(month)}
								className='text-left border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700/40'>
								<div className='flex justify-between items-center mb-2'>
									<h3 className='capitalize font-semibold text-gray-800 dark:text-white'>{monthName}</h3>
									<span className='text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'>
										{tasksCount} {t.calendarTasksBadge}
									</span>
								</div>
								<div className='grid grid-cols-7 gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1'>
									{weekdayHeaders.map((d) => (
										<span key={d} className='text-center'>
											{d}
										</span>
									))}
								</div>
								<div className='grid grid-cols-7 gap-1 text-xs'>
									{grid.map((day, idx) => (
										<div
											key={idx}
											className={`h-6 flex items-center justify-center rounded ${
												day ? 'text-gray-700 dark:text-gray-200' : 'text-transparent'
											}`}>
											{day || '.'}
										</div>
									))}
								</div>
							</motion.button>
						);
					})}
				</div>
			</div>
		);
	}

	const monthName =
		monthNames[selectedMonth] || getMonthName(new Date(selectedYear, selectedMonth, 1), locale);
	const monthTasks = (tareasPorMes.get(`${selectedYear}-${selectedMonth}`) || []).sort(
		(a, b) => a._dueDate - b._dueDate
	);
	const monthGrid = getMonthGrid(selectedYear, selectedMonth, weekStart);

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<div className='flex flex-wrap justify-between items-center gap-3 mb-4'>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => setSelectedMonth(null)}
						className='px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'>
						<i className='fa-solid fa-arrow-left mr-2'></i>
						{t.backToYear}
					</button>
					<h2 className='text-xl font-semibold text-gray-800 dark:text-white capitalize'>
						{monthName} {selectedYear}
					</h2>
				</div>
			</div>

			<div className='grid grid-cols-7 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
				{weekdayHeaders.map((day) => (
					<div key={day} className='text-center'>
						{day}
					</div>
				))}
			</div>
			<div className='grid grid-cols-7 gap-2 mb-6'>
				{monthGrid.map((day, idx) => {
					const taskCount = day
						? monthTasks.filter((task) => task._dueDate.getDate() === day).length
						: 0;
					return (
						<div
							key={idx}
							className={`min-h-20 rounded-lg border p-2 ${
								day
									? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40'
									: 'border-transparent'
							}`}>
							{day && (
								<>
									<div className='text-sm font-semibold text-gray-700 dark:text-gray-200'>{day}</div>
									{taskCount > 0 && (
										<div className='mt-1 text-xs text-indigo-600 dark:text-indigo-300'>
											{taskCount} {t.calendarTasksBadge}
										</div>
									)}
								</>
							)}
						</div>
					);
				})}
			</div>

			<div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
				<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-3'>{t.monthTasksList}</h3>
				{monthTasks.length === 0 ? (
					<p className='text-gray-500 dark:text-gray-400'>{t.noMonthTasks}</p>
				) : (
					<ul className='space-y-2'>
						{monthTasks.map((task) => {
							const proxectoVinculado = proxectos.find((p) => p.id === task.proxectoId);
							return (
								<li
									key={task.id}
									className='rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700/40'>
									<div className='flex justify-between gap-2 items-start'>
										<div className='min-w-0 flex-1'>
											<p className='font-medium text-gray-800 dark:text-gray-100'>{task.titulo}</p>
											{task.descripcion && (
												<p className='text-sm text-gray-500 dark:text-gray-400'>{task.descripcion}</p>
											)}
											{proxectoVinculado && (
												<p
													className='mt-2 inline-flex items-center text-xs px-2.5 py-1 rounded-full'
													style={{
														backgroundColor: corHexARgba(proxectoVinculado.cor, 0.16),
														color: proxectoVinculado.cor || '#9333ea',
													}}>
													<i className='fa-solid fa-folder-tree mr-1.5'></i>
													{t.taskProject}: {proxectoVinculado.nome}
												</p>
											)}
										</div>
										<span className='text-xs text-gray-500 dark:text-gray-400 shrink-0'>
											{task._dueDate.toLocaleDateString(locale)}
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
