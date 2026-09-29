import { esApp } from '@/Utils/plataforma';

/*
 * Carga de calendarios iCal (p. ex. o "enderezo secreto en formato iCal" de Google Calendar).
 *
 * Google non permite descargar o .ics directamente desde o navegador (CORS), así que:
 * - Web: descárgase a través do servidor de Vite (/api/ical, en vite.config.js).
 * - App Android: CapacitorHttp fai a petición desde Android, onde non hai CORS.
 *   Chámase só aquí (non se activa globalmente) para non afectar ás conexións de Firebase.
 * A URL do calendario xa non se envía a servizos de terceiros.
 *
 * Cada calendario gárdase en localStorage. Se a descarga falla, úsase a última copia
 * boa (aínda que sexa vella) en vez de deixar o calendario baleiro.
 */

const PREFIXO_CACHE = 'ical_cache_v2:';
// Durante este tempo non se volve descargar (evita peticións repetidas).
const CACHE_FRESCA_MS = 10 * 60 * 1000;
const TEMPO_MAXIMO_MS = 20000;

// ---------- Parser ----------

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

// ---------- Repeticións (RRULE) ----------

const DIAS_SEMANA = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const MAX_OCORRENCIAS = 1000;
const MAX_ITERACIONS = 60000;

const claveDia = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const sumarDias = (date, dias) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + dias);
const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate();

function parseRrule(texto) {
	const partes = Object.fromEntries(
		String(texto || '')
			.split(';')
			.map((parte) => parte.split('='))
			.filter(([clave, valor]) => clave && valor !== undefined)
			.map(([clave, valor]) => [clave.toUpperCase(), valor])
	);
	if (!partes.FREQ) return null;
	const enteiros = (valor) =>
		String(valor || '')
			.split(',')
			.map((v) => Number.parseInt(v, 10))
			.filter((n) => Number.isFinite(n) && n !== 0);
	return {
		freq: partes.FREQ.toUpperCase(),
		interval: Math.max(1, Number.parseInt(partes.INTERVAL || '1', 10) || 1),
		count: partes.COUNT ? Number.parseInt(partes.COUNT, 10) : null,
		until: partes.UNTIL ? parseIcalDate(partes.UNTIL) : null,
		byday: String(partes.BYDAY || '')
			.split(',')
			.map((v) => v.trim().toUpperCase().match(/^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/))
			.filter(Boolean)
			.map((m) => ({ n: m[1] ? Number.parseInt(m[1], 10) : 0, dow: DIAS_SEMANA[m[2]] })),
		bymonthday: enteiros(partes.BYMONTHDAY),
		bymonth: enteiros(partes.BYMONTH).filter((m) => m >= 1 && m <= 12),
		wkst: DIAS_SEMANA[(partes.WKST || 'MO').toUpperCase()] ?? 1,
	};
}

/** Días dun mes que cumpren BYMONTHDAY / BYDAY (ou o mesmo día ca o inicio). */
function candidatosMes(ano, mes, regra, inicio) {
	const total = diasNoMes(ano, mes);
	let dias = [];
	if (regra.bymonthday.length) {
		dias = regra.bymonthday.map((d) => (d > 0 ? d : total + d + 1)).filter((d) => d >= 1 && d <= total);
	} else if (regra.byday.length) {
		regra.byday.forEach(({ n, dow }) => {
			const doMes = [];
			for (let d = 1; d <= total; d += 1) if (new Date(ano, mes, d).getDay() === dow) doMes.push(d);
			if (n === 0) dias.push(...doMes);
			else {
				const d = n > 0 ? doMes[n - 1] : doMes[doMes.length + n];
				if (d) dias.push(d);
			}
		});
	} else if (inicio.getDate() <= total) {
		// Un evento o día 31 non se repite nos meses máis curtos (como fai Google).
		dias = [inicio.getDate()];
	}
	return [...new Set(dias)].sort((a, b) => a - b).map((d) => new Date(ano, mes, d));
}

/** Datas dun evento repetido dentro de [desde, ata]. */
function expandirRrule(inicio, regra, desde, ata) {
	const fin = regra.until && regra.until < ata ? regra.until : ata;
	const enRango = (data) => data >= desde && data <= ata;
	// O límite de ocorrencias conta só as do rango: un evento diario de hai anos segue saíndo.
	const datas = enRango(inicio) ? [inicio] : [];
	let xeradas = 1;
	let iteracions = 0;

	const engadir = (candidatas) => {
		for (const data of candidatas) {
			if (data <= inicio) continue;
			if (data > fin || (regra.count && xeradas >= regra.count)) return false;
			xeradas += 1;
			if (enRango(data)) datas.push(data);
			if (datas.length >= MAX_OCORRENCIAS) return false;
		}
		return true;
	};

	for (let paso = 1; iteracions < MAX_ITERACIONS; paso += 1, iteracions += 1) {
		let candidatas = [];
		let inicioPeriodo;
		if (regra.freq === 'DAILY') {
			inicioPeriodo = sumarDias(inicio, paso * regra.interval);
			candidatas = [inicioPeriodo];
		} else if (regra.freq === 'WEEKLY') {
			const semana0 = sumarDias(inicio, -((inicio.getDay() - regra.wkst + 7) % 7));
			const semana = sumarDias(semana0, (paso - 1) * 7 * regra.interval);
			inicioPeriodo = semana;
			const dows = regra.byday.length ? regra.byday.map((b) => b.dow) : [inicio.getDay()];
			candidatas = dows
				.map((dow) => sumarDias(semana, (dow - regra.wkst + 7) % 7))
				.sort((a, b) => a - b);
		} else if (regra.freq === 'MONTHLY') {
			const mesTotal = inicio.getMonth() + (paso - 1) * regra.interval;
			const ano = inicio.getFullYear() + Math.floor(mesTotal / 12);
			const mes = ((mesTotal % 12) + 12) % 12;
			inicioPeriodo = new Date(ano, mes, 1);
			candidatas = candidatosMes(ano, mes, regra, inicio);
		} else if (regra.freq === 'YEARLY') {
			const ano = inicio.getFullYear() + (paso - 1) * regra.interval;
			inicioPeriodo = new Date(ano, 0, 1);
			const meses = regra.bymonth.length ? regra.bymonth.map((m) => m - 1) : [inicio.getMonth()];
			const soDia = !regra.bymonthday.length && !regra.byday.length;
			candidatas = meses
				.flatMap((mes) =>
					soDia
						? inicio.getDate() <= diasNoMes(ano, mes)
							? [new Date(ano, mes, inicio.getDate())]
							: []
						: candidatosMes(ano, mes, regra, inicio)
				)
				.sort((a, b) => a - b);
		} else {
			break; // HOURLY, MINUTELY...: móstrase só o primeiro día.
		}
		if (inicioPeriodo > fin) break;
		if (!engadir(candidatas)) break;
	}

	return datas;
}

function parseListaDatas(valor) {
	return String(valor || '')
		.split(',')
		.map((v) => parseIcalDate(v))
		.filter(Boolean);
}

/**
 * Eventos dun .ics, cos repetidos expandidos entre `desde` e `ata`
 * (por defecto, dende o 1 de xaneiro do ano pasado ata o 31 de decembro de dentro de 2 anos).
 * O nome visible do calendario ("fonte") pono a vista.
 */
export function parseIcalEvents(icalText, calendarIndex = 0, rango = {}) {
	if (!icalText || typeof icalText !== 'string') return [];

	const hoxe = new Date();
	const desde = rango.desde || new Date(hoxe.getFullYear() - 1, 0, 1);
	const ata = rango.ata || new Date(hoxe.getFullYear() + 2, 11, 31);

	const unfolded = icalText.replace(/\r?\n[ \t]/g, '');
	const lines = unfolded.split(/\r?\n/);
	const vevents = [];
	let current = null;

	lines.forEach((line) => {
		if (line === 'BEGIN:VEVENT') {
			current = { exdates: [] };
			return;
		}
		if (line === 'END:VEVENT') {
			if (current?.dtstart) vevents.push(current);
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
		if (key === 'RRULE') current.rrule = value;
		if (key === 'EXDATE') current.exdates.push(...parseListaDatas(value));
		if (key === 'RECURRENCE-ID') current.recurrenceId = value;
		if (key === 'STATUS') current.status = value.toUpperCase();
	});

	// Ocorrencias cambiadas ou canceladas dun evento repetido (mesmo UID + RECURRENCE-ID).
	const substituidas = new Set();
	vevents.forEach((evento) => {
		const data = evento.recurrenceId ? parseIcalDate(evento.recurrenceId) : null;
		if (data && evento.uid) substituidas.add(`${evento.uid}|${claveDia(data)}`);
	});

	const events = [];
	const crear = (evento, data, sufixo = '') => ({
		id: `${evento.uid || `cal${calendarIndex}-${events.length}`}${sufixo}`,
		titulo: evento.summary || 'Evento',
		descripcion: evento.description || '',
		_dueDate: data,
		orixe: 'ical',
		calendarIndex,
	});

	vevents.forEach((evento) => {
		const inicio = parseIcalDate(evento.dtstart);
		if (!inicio) return;
		if (evento.status === 'CANCELLED') return;

		if (evento.recurrenceId) {
			if (inicio >= desde && inicio <= ata) events.push(crear(evento, inicio, `|${claveDia(inicio)}`));
			return;
		}

		const regra = evento.rrule ? parseRrule(evento.rrule) : null;
		if (!regra) {
			events.push(crear(evento, inicio));
			return;
		}

		const excluidas = new Set(evento.exdates.map(claveDia));
		expandirRrule(inicio, regra, desde, ata).forEach((data) => {
			const clave = claveDia(data);
			if (excluidas.has(clave) || substituidas.has(`${evento.uid}|${clave}`)) return;
			events.push(crear(evento, data, `|${clave}`));
		});
	});

	return events;
}

// ---------- URL e caché ----------

export function normalizeIcalUrl(url) {
	if (typeof url !== 'string') return '';
	const trimmed = url.trim().replace(/^['"]|['"]$/g, '');
	if (!trimmed) return '';
	if (trimmed.startsWith('webcal://')) return `https://${trimmed.slice('webcal://'.length)}`;
	return trimmed;
}

function lerCache(url) {
	try {
		const parsed = JSON.parse(localStorage.getItem(`${PREFIXO_CACHE}${url}`) || 'null');
		if (!parsed?.body || typeof parsed?.savedAt !== 'number') return null;
		return parsed;
	} catch {
		return null;
	}
}

function gardarCache(url, body) {
	try {
		localStorage.setItem(`${PREFIXO_CACHE}${url}`, JSON.stringify({ body, savedAt: Date.now() }));
	} catch {
		// localStorage cheo: bórranse as copias doutros calendarios e reinténtase.
		try {
			Object.keys(localStorage)
				.filter((clave) => clave.startsWith('ical_cache_') && clave !== `${PREFIXO_CACHE}${url}`)
				.forEach((clave) => localStorage.removeItem(clave));
			localStorage.setItem(`${PREFIXO_CACHE}${url}`, JSON.stringify({ body, savedAt: Date.now() }));
		} catch {
			/* empty */
		}
	}
}

// ---------- Descarga ----------

async function descargarTexto(url) {
	const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
	let temporizador;
	const tempoEsgotado = new Promise((_, reject) => {
		temporizador = setTimeout(() => {
			controller?.abort();
			reject(new Error('Tempo esgotado'));
		}, TEMPO_MAXIMO_MS);
	});
	try {
		const peticion = fetch(url, controller ? { signal: controller.signal } : undefined).then(async (response) => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.text();
		});
		const texto = await Promise.race([peticion, tempoEsgotado]);
		if (!texto?.includes('BEGIN:VCALENDAR')) throw new Error('Contido iCal inválido');
		return texto;
	} finally {
		clearTimeout(temporizador);
	}
}

async function descargarNaApp(url) {
	const { CapacitorHttp } = await import('@capacitor/core');
	const peticion = CapacitorHttp.get({
		url,
		responseType: 'text',
		connectTimeout: TEMPO_MAXIMO_MS,
		readTimeout: TEMPO_MAXIMO_MS,
	});
	const resposta = await Promise.race([
		peticion,
		new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado')), TEMPO_MAXIMO_MS + 2000)),
	]);
	if (resposta.status < 200 || resposta.status >= 300) throw new Error(`HTTP ${resposta.status}`);
	const texto = typeof resposta.data === 'string' ? resposta.data : '';
	if (!texto.includes('BEGIN:VCALENDAR')) throw new Error('Contido iCal inválido');
	return texto;
}

async function descargarIcal(url) {
	if (esApp) return descargarNaApp(url);
	try {
		return await descargarTexto(`/api/ical?url=${encodeURIComponent(url)}`);
	} catch (erroProxy) {
		// Sen servidor de Vite (p. ex. web publicada noutro sitio): proba directa,
		// que só funciona se o calendario permite CORS.
		try {
			return await descargarTexto(url);
		} catch {
			throw erroProxy;
		}
	}
}

// Se se pide o mesmo calendario mentres xa se está descargando, reutilízase a petición.
const descargasEnCurso = new Map();

async function obterCalendario(url) {
	const cache = lerCache(url);
	if (cache && Date.now() - cache.savedAt < CACHE_FRESCA_MS) {
		return { body: cache.body, desactualizado: false };
	}

	if (!descargasEnCurso.has(url)) {
		descargasEnCurso.set(
			url,
			descargarIcal(url).finally(() => descargasEnCurso.delete(url))
		);
	}

	try {
		const body = await descargasEnCurso.get(url);
		gardarCache(url, body);
		return { body, desactualizado: false };
	} catch (error) {
		if (cache) {
			console.warn(`[ical] Non se puido actualizar ${url}; úsase a copia do ${new Date(cache.savedAt).toLocaleString()}.`, error);
			return { body: cache.body, desactualizado: true, gardadoEn: cache.savedAt };
		}
		throw error;
	}
}

/**
 * Carga ata 3 calendarios.
 * @returns {Promise<{eventos: object[], fallados: number, desactualizados: number}>}
 */
export async function cargarCalendariosIcal(urls = []) {
	const resultados = await Promise.allSettled(
		urls.map(async (url, index) => {
			const normalizada = normalizeIcalUrl(url);
			if (!normalizada) throw new Error('URL iCal baleira');
			const { body, desactualizado } = await obterCalendario(normalizada);
			return { eventos: parseIcalEvents(body, index + 1), desactualizado };
		})
	);

	const correctos = resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value);
	resultados
		.filter((r) => r.status === 'rejected')
		.forEach((r) => console.warn('[ical] Erro cargando un calendario:', r.reason));

	return {
		eventos: correctos.flatMap((r) => r.eventos),
		fallados: resultados.length - correctos.length,
		desactualizados: correctos.filter((r) => r.desactualizado).length,
	};
}
