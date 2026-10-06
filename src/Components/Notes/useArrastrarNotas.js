import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ESPERA_ENTRE_MOVEMENTOS_MS = 120;
const MARXE_AUTOSCROLL_PX = 70;
const VELOCIDADE_AUTOSCROLL_PX = 14;

const buscarContedorScroll = (elemento) => {
	let actual = elemento?.parentElement;
	while (actual && actual !== document.body) {
		const { overflowY } = getComputedStyle(actual);
		if ((overflowY === 'auto' || overflowY === 'scroll') && actual.scrollHeight > actual.clientHeight) {
			return actual;
		}
		actual = actual.parentElement;
	}
	return null;
};

export default function useArrastrarNotas(notas, onSoltar, opcions = {}) {
	const atributo = opcions.atributo || 'nota-id';
	const grupo = opcions.grupo || ((nota) => Boolean(nota?.fixada));
	const [ordeTemporal, setOrdeTemporal] = useState(null);
	const [arrastrandoId, setArrastrandoId] = useState(null);
	const estado = useRef(null);

	const mapa = useMemo(() => new Map(notas.map((nota) => [nota.id, nota])), [notas]);

	const notasOrdenadas = useMemo(() => {
		if (!ordeTemporal) return notas;
		const lista = ordeTemporal.map((id) => mapa.get(id)).filter(Boolean);
		notas.forEach((nota) => {
			if (!ordeTemporal.includes(nota.id)) lista.push(nota);
		});
		return lista;
	}, [notas, ordeTemporal, mapa]);

	const mesmoGrupo = useCallback(
		(idA, idB) => grupo(mapa.get(idA)) === grupo(mapa.get(idB)),
		[mapa]
	);

	const moverAntesDeOuDespoisDe = (orde, id, destinoId) => {
		const indiceOrixe = orde.indexOf(id);
		const indiceDestino = orde.indexOf(destinoId);
		if (indiceOrixe === -1 || indiceDestino === -1) return orde;
		const nova = orde.filter((x) => x !== id);
		const posicion = nova.indexOf(destinoId) + (indiceOrixe < indiceDestino ? 1 : 0);
		nova.splice(posicion, 0, id);
		return nova;
	};

	const autoScroll = (clientY) => {
		const contedor = estado.current?.contedorScroll;
		const arriba = contedor ? contedor.getBoundingClientRect().top : 0;
		const abaixo = contedor ? contedor.getBoundingClientRect().bottom : window.innerHeight;
		let delta = 0;
		if (clientY < arriba + MARXE_AUTOSCROLL_PX) delta = -VELOCIDADE_AUTOSCROLL_PX;
		else if (clientY > abaixo - MARXE_AUTOSCROLL_PX) delta = VELOCIDADE_AUTOSCROLL_PX;
		if (!delta) return;
		if (contedor) contedor.scrollBy(0, delta);
		else window.scrollBy(0, delta);
	};

	const manexadores = useRef({});

	const onPointerDown = (e, id) => {
		if (e.button !== undefined && e.button !== 0) return;
		if (e.target.closest?.('button:not([data-asa]), a, input, textarea, select, label')) return;
		e.preventDefault();
		const orde = notas.map((nota) => nota.id);
		estado.current = {
			id,
			orde,
			ordeInicial: orde.join('|'),
			ultimoMovemento: 0,
			contedorScroll: buscarContedorScroll(e.currentTarget),
		};
		setOrdeTemporal(orde);
		setArrastrandoId(id);

		const mover = (ev) => manexadores.current.mover?.(ev);
		const soltar = () => {
			window.removeEventListener('pointermove', mover);
			window.removeEventListener('pointerup', soltar);
			window.removeEventListener('pointercancel', soltar);
			manexadores.current.rematar?.();
		};
		window.addEventListener('pointermove', mover);
		window.addEventListener('pointerup', soltar);
		window.addEventListener('pointercancel', soltar);
	};

	const onPointerMove = (e) => {
		const actual = estado.current;
		if (!actual) return;
		autoScroll(e.clientY);
		if (Date.now() - actual.ultimoMovemento < ESPERA_ENTRE_MOVEMENTOS_MS) return;

		const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest(`[data-${atributo}]`);
		const destinoId = destino?.getAttribute(`data-${atributo}`);
		if (!destinoId || destinoId === actual.id || !mesmoGrupo(actual.id, destinoId)) return;

		const nova = moverAntesDeOuDespoisDe(actual.orde, actual.id, destinoId);
		if (nova.join('|') === actual.orde.join('|')) return;
		actual.orde = nova;
		actual.ultimoMovemento = Date.now();
		setOrdeTemporal(nova);
	};

	const rematar = () => {
		const actual = estado.current;
		estado.current = null;
		setArrastrandoId(null);
		setOrdeTemporal(null);
		if (actual && actual.orde.join('|') !== actual.ordeInicial) onSoltar(actual.orde);
	};

	useEffect(() => {
		manexadores.current = { mover: onPointerMove, rematar };
	});

	const onKeyDown = (e, id) => {
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		const orde = notas.map((nota) => nota.id);
		const indice = orde.indexOf(id);
		const destinoId = orde[indice + (e.key === 'ArrowUp' ? -1 : 1)];
		if (!destinoId || !mesmoGrupo(id, destinoId)) return;
		onSoltar(moverAntesDeOuDespoisDe(orde, id, destinoId));
	};

	const propsZona = (id, activo = true) =>
		activo ? { onPointerDown: (e) => onPointerDown(e, id), style: { touchAction: 'none' } } : {};

	const propsAsa = (id) => ({
		'data-asa': true,
		onKeyDown: (e) => onKeyDown(e, id),
	});

	return { notasOrdenadas, arrastrandoId, propsZona, propsAsa };
}
