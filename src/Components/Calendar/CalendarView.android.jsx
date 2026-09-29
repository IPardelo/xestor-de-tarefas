import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { seleccionarTodasLasTareas } from '@/Features/Tasks/tareasSlice';
import { seleccionarProxectos } from '@/Features/Projects/proxectosSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { seleccionarUsuarioActual } from '@/Features/Users/usuariosSlice';
import { translations } from '@/i18n/translations';
import { cargarCalendariosIcal } from '@/Utils/ical';

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

function ensureDate(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return new Date(value.getFullYear(), value.getMonth(), value.getDate());
	}
	if (typeof value === 'string') return normalizeDate(value);
	return null;
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
	const tarefas = useSelector(seleccionarTodasLasTareas);
	const proxectos = useSelector(seleccionarProxectos);
	const usuarioActual = useSelector(seleccionarUsuarioActual);
	const t = translations[idioma] || translations.gl;
	const tarefasSeguras = Array.isArray(tarefas) ? tarefas : [];
	const proxectosSeguros = Array.isArray(proxectos) ? proxectos : [];
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
	const [selectedDay, setSelectedDay] = useState(null);
	const [eventosIcal, setEventosIcal] = useState([]);
	const [icalLoading, setIcalLoading] = useState(false);
	const [icalError, setIcalError] = useState('');
	const [icalDesactualizado, setIcalDesactualizado] = useState(false);

	const calendariosIcal = useMemo(() => {
		const listaBruta = usuarioActual?.calendariosIcal;
		if (!Array.isArray(listaBruta)) return [];
		return listaBruta
			.filter((url) => typeof url === 'string')
			.map((url) => url.trim())
			.filter(Boolean)
			.slice(0, 3);
	}, [usuarioActual?.calendariosIcal]);

	const tarefasConData = useMemo(
		() =>
			tarefasSeguras
				.filter((tarefa) => tarefa && tarefa.fechaVencimiento)
				.map((tarefa) => ({ ...tarefa, _dueDate: normalizeDate(tarefa.fechaVencimiento) }))
				.filter((tarefa) => tarefa._dueDate),
		[tarefasSeguras]
	);

	// Clave estable: só se volve cargar cando cambian de verdade as URL.
	const claveCalendarios = calendariosIcal.join('\n');

	useEffect(() => {
		let cancelled = false;
		const urls = claveCalendarios ? claveCalendarios.split('\n') : [];

		if (urls.length === 0) {
			setEventosIcal([]);
			setIcalError('');
			setIcalDesactualizado(false);
			setIcalLoading(false);
			return undefined;
		}

		setIcalLoading(true);
		cargarCalendariosIcal(urls)
			.then(({ eventos, fallados, desactualizados }) => {
				if (cancelled) return;
				setEventosIcal(eventos);
				setIcalError(fallados > 0 ? 'erro' : '');
				setIcalDesactualizado(desactualizados > 0);
			})
			.catch(() => {
				if (cancelled) return;
				setIcalError('erro');
			})
			.finally(() => {
				if (!cancelled) setIcalLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [claveCalendarios]);

	const elementosCalendario = useMemo(() => {
		const tarefasNormalizadas = tarefasConData.map((tarefa) => ({ ...tarefa, orixe: 'tarefa' }));
		// O nome do calendario ponse aquí para que cambie co idioma sen volver descargar.
		const eventosConFonte = eventosIcal.map((evento) => ({
			...evento,
			fonte: `${t.googleCalendarSourceLabel} ${evento.calendarIndex}`,
		}));
		return [...tarefasNormalizadas, ...eventosConFonte];
	}, [tarefasConData, eventosIcal, t.googleCalendarSourceLabel]);

	const tarefasPorMes = useMemo(() => {
		const map = new Map();
		elementosCalendario.forEach((tarefa) => {
			const dueDate = ensureDate(tarefa?._dueDate) || ensureDate(tarefa?.fechaVencimiento);
			if (!dueDate) return;
			const key = `${dueDate.getFullYear()}-${dueDate.getMonth()}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key).push({ ...tarefa, _dueDate: dueDate });
		});
		return map;
	}, [elementosCalendario]);

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
			<motion.div
				key={`year-${selectedYear}`}
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.25 }}
				className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			{icalLoading && (
				<p className='mb-4 text-sm text-indigo-600 dark:text-indigo-300'>{t.googleCalendarLoading}</p>
			)}
			{icalError && <p className='mb-4 text-sm text-red-600 dark:text-red-300'>{t.googleCalendarLoadError}</p>}
			{!icalError && icalDesactualizado && (
				<p className='mb-4 text-sm text-amber-600 dark:text-amber-300'>{t.googleCalendarStaleNotice}</p>
			)}

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
						const monthItems = tarefasPorMes.get(`${selectedYear}-${month}`) || [];
						const tasksCount = monthItems.length;
						const daysWithTasks = new Set(
							monthItems
								.map((item) => ensureDate(item?._dueDate))
								.filter(Boolean)
								.map((date) => date.getDate())
						);

						return (
							<motion.button
								type='button'
								key={month}
								whileHover={{ y: -2 }}
								onClick={() => {
									setSelectedMonth(month);
									setSelectedDay(null);
								}}
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
												day
													? `text-gray-700 dark:text-gray-200 ${
															daysWithTasks.has(day)
																? 'ring-1 ring-indigo-500 dark:ring-indigo-400'
																: ''
														}`
													: 'text-transparent'
											}`}>
											{day || '.'}
										</div>
									))}
								</div>
							</motion.button>
						);
					})}
				</div>
			</motion.div>
		);
	}

	const monthName =
		monthNames[selectedMonth] || getMonthName(new Date(selectedYear, selectedMonth, 1), locale);
	const monthTasks = (tarefasPorMes.get(`${selectedYear}-${selectedMonth}`) || [])
		.filter((task) => ensureDate(task?._dueDate))
		.sort((a, b) => ensureDate(a._dueDate) - ensureDate(b._dueDate));
	const monthGrid = getMonthGrid(selectedYear, selectedMonth, weekStart);
	const monthTasksByDay = (() => {
		const map = new Map();
		monthTasks.forEach((task) => {
			const dueDate = ensureDate(task?._dueDate);
			if (!dueDate) return;
			const day = dueDate.getDate();
			if (!map.has(day)) map.set(day, []);
			map.get(day).push(task);
		});
		return map;
	})();
	const visibleTasks =
		selectedDay === null ? monthTasks : monthTasksByDay.get(selectedDay)?.slice().sort((a, b) => ensureDate(a._dueDate) - ensureDate(b._dueDate)) || [];
	const formatoDiaMes = new Intl.DateTimeFormat(locale, {
		day: '2-digit',
		month: 'long',
	});
	const listTitle =
		selectedDay === null
			? t.monthTasksList
			: `${t.dayTasksList || t.monthTasksList} ${formatoDiaMes.format(
					new Date(selectedYear, selectedMonth, selectedDay)
				)}`;

	const obterEstiloCalendarioIcal = (calendarIndex) => {
		if (calendarIndex === 1) {
			return { cor: '#0ea5e9', icono: 'fa-calendar-days' };
		}
		if (calendarIndex === 2) {
			return { cor: '#a855f7', icono: 'fa-calendar-day' };
		}
		if (calendarIndex === 3) {
			return { cor: '#f59e0b', icono: 'fa-calendar-week' };
		}
		return { cor: '#6366f1', icono: 'fa-calendar' };
	};

	const obterTiposPorDia = (day) => {
		const items = monthTasksByDay.get(day) || [];
		const vistos = new Set();
		return items
			.map((task) => {
				if (task.orixe === 'ical') {
					const key = `cal-${task.calendarIndex || 0}`;
					if (vistos.has(key)) return null;
					vistos.add(key);
					const estilo = obterEstiloCalendarioIcal(task.calendarIndex);
					return {
						key,
						cor: estilo.cor,
						icono: estilo.icono,
						titulo: task.fonte || t.googleCalendarLabel,
					};
				}
				const proxectoVinculado = proxectosSeguros.find((p) => p.id === task.proxectoId);
				const key = `proj-${proxectoVinculado?.id || 'none'}`;
				if (vistos.has(key)) return null;
				vistos.add(key);
				return {
					key,
					cor: proxectoVinculado?.cor || '#6366f1',
					icono: 'fa-folder-tree',
					titulo: proxectoVinculado?.nome || t.taskProject,
				};
			})
			.filter(Boolean)
			.slice(0, 2);
	};

	return (
		<motion.div
			key={`month-${selectedYear}-${selectedMonth}`}
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.25 }}
			className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			{icalLoading && (
				<p className='mb-4 text-sm text-indigo-600 dark:text-indigo-300'>{t.googleCalendarLoading}</p>
			)}
			{icalError && <p className='mb-4 text-sm text-red-600 dark:text-red-300'>{t.googleCalendarLoadError}</p>}
			{!icalError && icalDesactualizado && (
				<p className='mb-4 text-sm text-amber-600 dark:text-amber-300'>{t.googleCalendarStaleNotice}</p>
			)}

			<div className='flex flex-wrap justify-between items-center gap-3 mb-4'>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => {
							setSelectedMonth(null);
							setSelectedDay(null);
						}}
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
					const tiposDia = day ? obterTiposPorDia(day) : [];
					return (
						<button
							type='button'
							key={idx}
							onClick={() => {
								if (!day) return;
								setSelectedDay(day);
							}}
							className={`min-h-20 rounded-lg border p-2 text-left transition-colors relative ${
								day
									? `border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 hover:bg-white dark:hover:bg-gray-700 ${
											selectedDay === day ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
										}`
									: 'border-transparent'
							}`}>
							{day && (
								<>
									<div className='absolute top-2 left-2 text-sm font-semibold text-gray-700 dark:text-gray-200'>
										{day}
									</div>
									<div className='mt-7 flex flex-wrap gap-1.5 max-w-[98px]'>
											{tiposDia.map((tipo) => (
												<span
													key={tipo.key}
													title={tipo.titulo}
													className='inline-flex items-center justify-center w-8 h-8 rounded-full'
													style={{ backgroundColor: corHexARgba(tipo.cor, 0.18), color: tipo.cor }}>
													<i className={`fa-solid ${tipo.icono} text-sm`}></i>
												</span>
											))}
									</div>
									{/* Sen contador numérico: só iconas de tipo por día */}
								</>
							)}
						</button>
					);
				})}
			</div>

			<div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
				<div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
					<h3 className='text-lg font-semibold text-gray-800 dark:text-white'>{listTitle}</h3>
					{selectedDay !== null && (
						<button
							type='button'
							onClick={() => setSelectedDay(null)}
							className='px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm'>
							<i className='fa-solid fa-rotate-left mr-2'></i>
							{t.backToMonth}
						</button>
					)}
				</div>
				{visibleTasks.length === 0 ? (
					<p className='text-gray-500 dark:text-gray-400'>{t.noMonthTasks}</p>
				) : (
					<ul className='space-y-3'>
						{visibleTasks.map((task) => {
							const proxectoVinculado = proxectosSeguros.find((p) => p.id === task.proxectoId);
							const corLateralIcal =
								task.calendarIndex === 1
									? '#0ea5e9'
									: task.calendarIndex === 3
										? '#f59e0b'
										: '#a855f7';
							const claseEtiquetaCalendario =
								task.calendarIndex === 1
									? 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
									: task.calendarIndex === 3
										? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
										: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
							return (
								<motion.li
									key={task.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className={`rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 bg-gradient-to-br from-gray-50 to-neutral-100 dark:from-gray-700 dark:to-gray-800 ${
										task.orixe === 'ical' ? 'border-sky-500' : 'border-indigo-500'
									}`}
									style={{
										borderLeftColor:
											task.orixe === 'ical'
												? corLateralIcal
												: proxectoVinculado?.cor || '#6366f1',
									}}>
									<div className='flex justify-between gap-2 items-start'>
										<div className='min-w-0 flex-1'>
											<p className='font-medium text-gray-800 dark:text-gray-100'>{task.titulo}</p>
											{task.descripcion && (
												<p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>{task.descripcion}</p>
											)}
											<div className='mt-3 flex flex-wrap items-center gap-2'>
												{task.orixe === 'ical' && (
													<span
														className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${claseEtiquetaCalendario}`}>
														<i className='fa-solid fa-calendar-check mr-1.5'></i>
														{task.fonte || t.googleCalendarLabel}
													</span>
												)}
												{proxectoVinculado && (
													<span
														className='inline-flex items-center text-xs px-2.5 py-1 rounded-full'
														style={{
															backgroundColor: corHexARgba(proxectoVinculado.cor, 0.16),
															color: proxectoVinculado.cor || '#9333ea',
														}}>
														<i className='fa-solid fa-folder-tree mr-1.5'></i>
														{proxectoVinculado.nome}
													</span>
												)}
											</div>
										</div>
										<span className='text-xs text-gray-500 dark:text-gray-400 shrink-0'>
											{ensureDate(task._dueDate)?.toLocaleDateString(locale) || ''}
										</span>
									</div>
								</motion.li>
							);
						})}
					</ul>
				)}
			</div>
		</motion.div>
	);
}
