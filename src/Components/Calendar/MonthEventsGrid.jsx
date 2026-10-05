import { useMemo } from 'react';

/*
 * Grella mensual con eventos visibles (estilo app de calendario):
 * - Cada día amosa os seus eventos como etiquetas de cor co título.
 * - Os eventos de varios días debúxanse como unha barra continua dentro da semana.
 * - Os días dos meses veciños vense atenuados para completar as semanas.
 */

const DIA_MS = 86400000;
const MAX_FILAS_VISIBLES = 3;

export const COR_TAREFA_POR_DEFECTO = '#6366f1';

export const corCalendarioIcal = (calendarIndex) =>
	calendarIndex === 1 ? '#0ea5e9' : calendarIndex === 3 ? '#f59e0b' : '#a855f7';

const soDia = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sumarDias = (date, dias) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + dias);
const diasEntre = (a, b) => Math.round((soDia(b) - soDia(a)) / DIA_MS);
const mesmoDia = (a, b) =>
	a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Texto escuro ou claro segundo a luminosidade da cor de fondo. */
function corTextoPara(hex) {
	const limpo = typeof hex === 'string' ? hex.replace('#', '') : '';
	if (!/^[0-9a-fA-F]{6}$/.test(limpo)) return '#ffffff';
	const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(limpo.slice(i, i + 2), 16) / 255);
	const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const luminancia = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
	return luminancia > 0.4 ? '#1f2937' : '#ffffff';
}

/** Inicio e fin (incluído) dun elemento do calendario. */
export function rangoElemento(item) {
	const inicio = item?._dueDate instanceof Date ? soDia(item._dueDate) : null;
	if (!inicio) return null;
	const fin = item?._endDate instanceof Date && item._endDate > inicio ? soDia(item._endDate) : inicio;
	return { inicio, fin };
}

/** Cor e icona dun elemento (tarefa, tarefa de proxecto ou evento iCal). */
export function estiloElemento(item, proxectos = []) {
	if (item?.orixe === 'ical') {
		return { cor: corCalendarioIcal(item.calendarIndex), icono: null };
	}
	const proxecto = proxectos.find((p) => p.id === item?.proxectoId);
	return {
		cor: proxecto?.cor || COR_TAREFA_POR_DEFECTO,
		icono: item?.completada ? 'fa-circle-check' : null,
	};
}

/** Semanas (arrays de 7 datas) que cobren o mes enteiro. */
function semanasDoMes(year, month, weekStart) {
	const primeiro = new Date(year, month, 1);
	const desfase = (primeiro.getDay() - weekStart + 7) % 7;
	let dia = sumarDias(primeiro, -desfase);
	const ultimo = new Date(year, month + 1, 0);
	const semanas = [];
	while (dia <= ultimo) {
		semanas.push([...Array(7)].map((_, i) => sumarDias(dia, i)));
		dia = sumarDias(dia, 7);
	}
	return semanas;
}

/** Coloca os eventos dunha semana en filas sen que se pisen. */
function distribuirSemana(semana, elementos) {
	const inicioSemana = semana[0];
	const finSemana = semana[6];
	const tramos = elementos
		.map((el) => {
			if (el.fin < inicioSemana || el.inicio > finSemana) return null;
			const desde = el.inicio < inicioSemana ? inicioSemana : el.inicio;
			const ata = el.fin > finSemana ? finSemana : el.fin;
			return {
				...el,
				col: diasEntre(inicioSemana, desde),
				span: diasEntre(desde, ata) + 1,
				continuaAntes: el.inicio < inicioSemana,
				continuaDespois: el.fin > finSemana,
			};
		})
		.filter(Boolean)
		// Primeiro os longos, despois por orde de inicio, para que as barras queden arriba.
		.sort((a, b) => b.span - a.span || a.col - b.col || a.orde - b.orde);

	const filas = [];
	tramos.forEach((tramo) => {
		let fila = 0;
		while (
			filas[fila] &&
			filas[fila].some((o) => tramo.col < o.col + o.span && o.col < tramo.col + tramo.span)
		) {
			fila += 1;
		}
		if (!filas[fila]) filas[fila] = [];
		filas[fila].push(tramo);
		tramo.fila = fila;
	});
	return tramos;
}

export default function MonthEventsGrid({
	year,
	month,
	weekStart,
	weekdayHeaders,
	items,
	proxectos,
	selectedDay,
	onSelectDay,
	compacto = false,
}) {
	const hoxe = soDia(new Date());
	const semanas = useMemo(() => semanasDoMes(year, month, weekStart), [year, month, weekStart]);

	const elementos = useMemo(
		() =>
			(items || [])
				.map((item, orde) => {
					const rango = rangoElemento(item);
					if (!rango) return null;
					const { cor, icono } = estiloElemento(item, proxectos);
					return { item, orde, ...rango, cor, icono };
				})
				.filter(Boolean),
		[items, proxectos]
	);

	const maxFilas = compacto ? 2 : MAX_FILAS_VISIBLES;

	return (
		<div className='rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700'>
			<div className='grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40'>
				{weekdayHeaders.map((d, i) => (
					<div
						key={`${d}-${i}`}
						className='py-2 text-center text-xs sm:text-sm font-medium uppercase text-gray-500 dark:text-gray-400'>
						{d}
					</div>
				))}
			</div>

			{semanas.map((semana) => {
				const tramos = distribuirSemana(semana, elementos);
				const visibles = tramos.filter((tr) => tr.fila < maxFilas);
				// Eventos que non collen, contados por día.
				const ocultosPorDia = semana.map(
					(dia) =>
						tramos.filter(
							(tr) => tr.fila >= maxFilas && dia >= tr.inicio && dia <= tr.fin
						).length
				);

				return (
					<div
						key={semana[0].toISOString()}
						className={`relative grid grid-cols-7 border-b last:border-b-0 border-gray-200 dark:border-gray-700 ${
							compacto ? 'min-h-[6.75rem]' : 'min-h-[8.5rem]'
						}`}>
						{/* Fondo: un botón por día co número */}
						{semana.map((dia, i) => {
							const doMes = dia.getMonth() === month;
							const eHoxe = mesmoDia(dia, hoxe);
							const seleccionado = doMes && selectedDay === dia.getDate();
							return (
								<button
									type='button'
									key={dia.toISOString()}
									disabled={!doMes}
									onClick={() => doMes && onSelectDay(dia.getDate())}
									className={`relative flex flex-col items-center pt-1.5 border-gray-200 dark:border-gray-700 transition-colors ${
										i < 6 ? 'border-r' : ''
									} ${doMes ? 'cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-gray-700/40' : 'cursor-default'} ${
										seleccionado ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
									}`}
									style={{ gridColumn: i + 1, gridRow: 1 }}>
									<span
										className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
											eHoxe
												? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold'
												: doMes
													? 'text-gray-800 dark:text-gray-100'
													: 'text-gray-400 dark:text-gray-500'
										}`}>
										{dia.getDate()}
									</span>
									{ocultosPorDia[i] > 0 && (
										<span className='absolute bottom-1 left-0 right-0 text-center text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400'>
											+{ocultosPorDia[i]}
										</span>
									)}
								</button>
							);
						})}

						{/* Capa de eventos */}
						<div
							className='pointer-events-none absolute inset-x-0 top-9 grid grid-cols-7 gap-y-1'
							style={{ gridAutoRows: compacto ? '1.15rem' : '1.3rem' }}>
							{visibles.map((tr) => {
								const { item } = tr;
								const corTexto = corTextoPara(tr.cor);
								const foraDoMes =
									tr.fin < new Date(year, month, 1) || tr.inicio > new Date(year, month + 1, 0);
								return (
									<button
										type='button'
										key={`${item.id}-${tr.col}`}
										title={item.titulo}
										onClick={() => {
											const dia = semana[tr.col];
											if (dia.getMonth() === month) onSelectDay(dia.getDate());
										}}
										className={`pointer-events-auto flex items-center gap-1 overflow-hidden whitespace-nowrap px-1 sm:px-1.5 text-left font-medium shadow-sm ${
											compacto ? 'text-[10px]' : 'text-[10px] sm:text-xs'
										} ${tr.continuaAntes ? 'rounded-l-none ml-0' : 'rounded-l-md ml-0.5'} ${
											tr.continuaDespois ? 'rounded-r-none mr-0' : 'rounded-r-md mr-0.5'
										} ${item.completada ? 'line-through opacity-70' : ''} ${foraDoMes ? 'opacity-50' : ''}`}
										style={{
											gridColumn: `${tr.col + 1} / span ${tr.span}`,
											gridRow: tr.fila + 1,
											backgroundColor: tr.cor,
											color: corTexto,
										}}>
										{tr.icono && <i className={`fa-solid ${tr.icono} text-[9px] shrink-0`}></i>}
										<span className='overflow-hidden sm:text-ellipsis'>{item.titulo}</span>
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
