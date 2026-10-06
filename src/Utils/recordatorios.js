import { esApp } from '@/Utils/plataforma';
import { cargarNotificacionsLocais } from '@/Utils/notificacionsLocais';

const CANLE = 'recordatorios-notas';
const CLAVE_AXUSTE_EXACTO = 'recordatorios_axuste_exacto_pedido';

let pluginPromesa = null;
let canleCreada = false;

const obterPlugin = () => {
	if (!esApp) return Promise.resolve(null);
	if (!pluginPromesa) {
		pluginPromesa = cargarNotificacionsLocais().catch((error) => {
			console.warn('[recordatorios] Non se puido cargar o plugin:', error);
			return null;
		});
	}
	return pluginPromesa;
};

export const dataRecordatorio = (nota) => {
	if (!nota?.recordatorio) return null;
	const data = new Date(nota.recordatorio);
	return Number.isNaN(data.getTime()) ? null : data;
};

const idNotificacion = (notaId) => {
	let hash = 0;
	const texto = String(notaId);
	for (let i = 0; i < texto.length; i += 1) {
		hash = (hash * 31 + texto.charCodeAt(i)) | 0;
	}
	return Math.abs(hash) || 1;
};

const resumoNota = (nota) => {
	if (nota.tipo === 'lista') {
		const pendentes = (nota.itensLista || []).filter((item) => !item.completado).map((item) => item.texto);
		return pendentes.slice(0, 5).join(' · ');
	}
	return String(nota.contido || '').slice(0, 200);
};

async function prepararCanle(plugin) {
	if (canleCreada) return;
	try {
		await plugin.createChannel({
			id: CANLE,
			name: 'Recordatorios de notas',
			description: 'Avisos dos recordatorios postos nas notas',
			importance: 5,
			visibility: 1,
			vibration: true,
		});
	} catch {
		/* versións de Android sen canles */
	}
	canleCreada = true;
}

export async function pedirPermisosRecordatorios() {
	const plugin = (await obterPlugin())?.plugin;
	if (!plugin) return false;
	try {
		let permiso = await plugin.checkPermissions();
		if (permiso.display !== 'granted') permiso = await plugin.requestPermissions();
		if (permiso.display !== 'granted') return false;

		const exacto = await plugin.checkExactNotificationSetting?.();
		if (exacto && exacto.exact_alarm !== 'granted' && !localStorage.getItem(CLAVE_AXUSTE_EXACTO)) {
			localStorage.setItem(CLAVE_AXUSTE_EXACTO, '1');
			await plugin.changeExactNotificationSetting?.();
		}
		sincronizarRecordatorios(ultimasNotas);
		return true;
	} catch (error) {
		console.warn('[recordatorios] Erro cos permisos:', error);
		return false;
	}
}

let cola = Promise.resolve();
let ultimasNotas = [];

export function sincronizarRecordatorios(notas) {
	ultimasNotas = notas || [];
	cola = cola.then(() => sincronizar(notas)).catch((error) => {
		console.warn('[recordatorios] Erro ao programar:', error);
	});
	return cola;
}

async function sincronizar(notas) {
	const plugin = (await obterPlugin())?.plugin;
	if (!plugin) return;
	const permiso = await plugin.checkPermissions();
	if (permiso.display !== 'granted') return;
	await prepararCanle(plugin);

	const agora = Date.now();
	const desexadas = new Map();
	(notas || []).forEach((nota) => {
		const data = dataRecordatorio(nota);
		if (!data || data.getTime() <= agora) return;
		desexadas.set(idNotificacion(nota.id), {
			id: idNotificacion(nota.id),
			title: nota.titulo || 'Recordatorio',
			body: resumoNota(nota) || 'Tes un recordatorio nesta nota',
			channelId: CANLE,
			schedule: { at: data, allowWhileIdle: true },
			extra: { notaId: nota.id, clave: `${nota.recordatorio}|${nota.titulo || ''}|${resumoNota(nota)}` },
		});
	});

	const { notifications: pendentes = [] } = await plugin.getPending();
	const aCancelar = [];
	const xaProgramadas = new Set();
	pendentes.forEach((pendente) => {
		const desexada = desexadas.get(pendente.id);
		if (desexada && pendente.extra?.clave === desexada.extra.clave) xaProgramadas.add(pendente.id);
		else aCancelar.push({ id: pendente.id });
	});

	if (aCancelar.length) await plugin.cancel({ notifications: aCancelar });
	const aProgramar = [...desexadas.values()].filter((n) => !xaProgramadas.has(n.id));
	if (aProgramar.length) await plugin.schedule({ notifications: aProgramar });
}

export function escoitarToquesRecordatorios(onAbrirNota) {
	let handle = null;
	let activo = true;
	obterPlugin().then(async (caixa) => {
		const plugin = caixa?.plugin;
		if (!plugin || !activo) return;
		handle = await plugin.addListener('localNotificationActionPerformed', (evento) => {
			const notaId = evento?.notification?.extra?.notaId;
			if (notaId) onAbrirNota(notaId);
		});
	});
	return () => {
		activo = false;
		handle?.remove?.();
	};
}
