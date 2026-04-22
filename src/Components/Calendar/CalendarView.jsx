import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { seleccionarTodasLasTareas } from '@/Features/Tasks/tareasSlice';
import { seleccionarProxectos } from '@/Features/Projects/proxectosSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { seleccionarUsuarioActual } from '@/Features/Users/usuariosSlice';
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

function ensureDate(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return new Date(value.getFullYear(), value.getMonth(), value.getDate());
	}
	if (typeof value === 'string') return normalizeDate(value);
	return null;
}

function parseIcalDate(rawValue) {
	if (!rawValue) return null;
	const value = String(rawValue).trim();

	if (/^\d{8}$/.test(value)) {
		const year = Number.parseInt(value.slice(0, 4), 10);
		const month = Number.parseInt(value.slice(4, 6), 10) - 1;
		const day = Number.parseInt(value.slice(6, 8), 10);
		return new Date(year, month, day);
	}

	if (/^\d{8}T\d{6}Z$/.test(value)) {
		const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(
			9,
			11
		)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
		const parsed = new Date(iso);
		return Number.isNaN(parsed.getTime())
			? null
			: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
	}

	if (/^\d{8}T\d{6}$/.test(value)) {
		const year = Number.parseInt(value.slice(0, 4), 10);
		const month = Number.parseInt(value.slice(4, 6), 10) - 1;
		const day = Number.parseInt(value.slice(6, 8), 10);
		return new Date(year, month, day);
	}

	const fallback = new Date(value);
	return Number.isNaN(fallback.getTime())
		? null
		: new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

function parseIcalEvents(icalText, sourceLabel, calendarIndex = 0) {
	if (!icalText || typeof icalText !== 'string') return [];

	const unfolded = icalText.replace(/\r?\n[ \t]/g, '');
	const lines = unfolded.split(/\r?\n/);
	const events = [];
	let current = null;

	lines.forEach((line) => {
		if (line === 'BEGIN:VEVENT') {
			current = {};
			return;
		}
		if (line === 'END:VEVENT') {
			if (current?.dtstart) {
				const date = parseIcalDate(current.dtstart);
				if (date) {
					events.push({
						id: current.uid || `${sourceLabel}-${events.length}-${date.toISOString()}`,
						titulo: current.summary || 'Evento',
						descripcion: current.description || '',
						_dueDate: date,
						orixe: 'ical',
						fonte: sourceLabel,
						calendarIndex,
					});
				}
			}
			current = null;
			return;
		}
		if (!current) return;

		const separator = line.indexOf(':');
		if (separator === -1) return;

		const rawKey = line.slice(0, separator);
		const value = line.slice(separator + 1).trim();
		const key = rawKey.split(';')[0].toUpperCase();
		if (key === 'DTSTART') current.dtstart = value;
		if (key === 'SUMMARY') current.summary = value;
		if (key === 'DESCRIPTION') current.description = value.replace(/\\n/g, '\n');
		if (key === 'UID') current.uid = value;
	});

	return events;
}

function normalizeIcalUrl(url) {
	if (typeof url !== 'string') return '';
	const trimmed = url.trim().replace(/^['"]|['"]$/g, '');
	if (!trimmed) return '';
	if (trimmed.startsWith('webcal://')) return `https://${trimmed.slice('webcal://'.length)}`;
	return trimmed;
}

const ICAL_CACHE_PREFIX = 'ical_cache_v1:';
const ICAL_CACHE_TTL_MS = 10 * 60 * 1000;

function getIcalCache(url) {
	try {
		const raw = localStorage.getItem(`${ICAL_CACHE_PREFIX}${url}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.body || typeof parsed?.savedAt !== 'number') return null;
		if (Date.now() - parsed.savedAt > ICAL_CACHE_TTL_MS) return null;
		return parsed.body;
	} catch {
		return null;
	}
}

function setIcalCache(url, body) {
	try {
		localStorage.setItem(
			`${ICAL_CACHE_PREFIX}${url}`,
			JSON.stringify({
				body,
				savedAt: Date.now(),
			})
		);
	} catch {
		/* empty */
	}
}

async function fetchWithTimeout(url, timeoutMs = 6000) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.text();
	} finally {
		clearTimeout(timeoutId);
	}
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
	const [eventosIcal, setEventosIcal] = useState([]);
	const [icalLoading, setIcalLoading] = useState(false);
	const [icalError, setIcalError] = useState('');

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

	useEffect(() => {
		let cancelled = false;

		const cargarEventosIcal = async () => {
			if (calendariosIcal.length === 0) {
				setEventosIcal([]);
				setIcalError('');
				setIcalLoading(false);
				return;
			}

			setIcalLoading(true);
			setIcalError('');

			try {
				const resultados = await Promise.allSettled(
					calendariosIcal.map(async (url, index) => {
						const normalizedUrl = normalizeIcalUrl(url);
						if (!normalizedUrl) {
							throw new Error('URL iCal baleira');
						}

						const cached = getIcalCache(normalizedUrl);
						let body = cached || '';

						if (!body) {
							const urlsCandidatas = [
								normalizedUrl,
								`https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`,
								`https://corsproxy.io/?${encodeURIComponent(normalizedUrl)}`,
							];

							const tentativas = urlsCandidatas.map((candidata) =>
								fetchWithTimeout(candidata).then((text) => {
									if (!text?.includes('BEGIN:VCALENDAR')) {
										throw new Error('Contido iCal inválido');
									}
									return text;
								})
							);

							body = await Promise.any(tentativas);
							setIcalCache(normalizedUrl, body);
						}

						if (!body || !body.includes('BEGIN:VCALENDAR')) {
							throw new Error('Contido iCal inválido');
						}

						const sourceLabel = `${t.googleCalendarSourceLabel} ${index + 1}`;
						return parseIcalEvents(body, sourceLabel, index + 1);
					})
				);

				if (!cancelled) {
					const eventosCargados = resultados
						.filter((resultado) => resultado.status === 'fulfilled')
						.flatMap((resultado) => resultado.value);

					setEventosIcal(eventosCargados);

					const totalFallados = resultados.filter((resultado) => resultado.status === 'rejected').length;
					if (totalFallados === calendariosIcal.length && calendariosIcal.length > 0) {
						setIcalError(t.googleCalendarLoadError);
					} else {
						setIcalError('');
					}
				}
			} catch {
				if (!cancelled) {
					setEventosIcal([]);
					setIcalError(t.googleCalendarLoadError);
				}
			} finally {
				if (!cancelled) {
					setIcalLoading(false);
				}
			}
		};

		cargarEventosIcal();

		return () => {
			cancelled = true;
		};
	}, [calendariosIcal, t.googleCalendarLoadError, t.googleCalendarSourceLabel]);

	const elementosCalendario = useMemo(() => {
		const tarefasNormalizadas = tarefasConData.map((tarefa) => ({ ...tarefa, orixe: 'tarefa' }));
		return [...tarefasNormalizadas, ...eventosIcal];
	}, [tarefasConData, eventosIcal]);

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
				{icalError && <p className='mb-4 text-sm text-red-600 dark:text-red-300'>{icalError}</p>}

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
			{icalError && <p className='mb-4 text-sm text-red-600 dark:text-red-300'>{icalError}</p>}

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
						? monthTasks.filter((task) => ensureDate(task._dueDate)?.getDate() === day).length
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
							const proxectoVinculado = proxectosSeguros.find((p) => p.id === task.proxectoId);
							const claseEtiquetaCalendario =
								task.calendarIndex === 1
									? 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
									: task.calendarIndex === 3
										? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
										: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
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
											{task.orixe === 'ical' && (
												<p
													className={`mt-2 inline-flex items-center text-xs px-2.5 py-1 rounded-full ${claseEtiquetaCalendario}`}>
													<i className='fa-solid fa-calendar-check mr-1.5'></i>
													{task.fonte || t.googleCalendarLabel}
												</p>
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
											{ensureDate(task._dueDate)?.toLocaleDateString(locale) || ''}
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</motion.div>
	);
}
