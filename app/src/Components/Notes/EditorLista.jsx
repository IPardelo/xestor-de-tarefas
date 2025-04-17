import { useEffect, useRef } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import useArrastrarNotas from '@/Components/Notes/useArrastrarNotas';

const novoItem = () => ({ id: nanoid(), texto: '', completado: false });

export default function EditorLista({ itens, onChange, t, compacto = false }) {
	const lista = Array.isArray(itens) ? itens : [];
	const inputs = useRef(new Map());
	const enfocarId = useRef(null);

	const { notasOrdenadas: itensOrdenados, arrastrandoId, propsZona } = useArrastrarNotas(
		lista,
		(ids) => onChange(ids.map((id) => lista.find((item) => item.id === id)).filter(Boolean)),
		{ atributo: 'item-id', grupo: () => 0 }
	);

	useEffect(() => {
		if (!enfocarId.current) return;
		const input = inputs.current.get(enfocarId.current);
		if (input) {
			input.focus();
			const fin = input.value.length;
			input.setSelectionRange(fin, fin);
		}
		enfocarId.current = null;
	});

	const inserir = (indice) => {
		const item = novoItem();
		const nova = [...lista];
		nova.splice(indice, 0, item);
		enfocarId.current = item.id;
		onChange(nova);
	};

	const cambiar = (id, cambios) =>
		onChange(lista.map((item) => (item.id === id ? { ...item, ...cambios } : item)));

	const eliminar = (id) => {
		const indice = lista.findIndex((item) => item.id === id);
		const anterior = lista[indice - 1] || lista[indice + 1];
		enfocarId.current = anterior?.id || null;
		onChange(lista.filter((item) => item.id !== id));
	};

	const onKeyDown = (e, item, indice) => {
		if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
			e.preventDefault();
			inserir(indice + 1);
		} else if (e.key === 'Backspace' && item.texto === '') {
			e.preventDefault();
			eliminar(item.id);
		}
	};

	const tamanoTexto = compacto ? 'text-sm' : 'text-base';

	return (
		<div className='space-y-1'>
			<button
				type='button'
				onClick={() => inserir(0)}
				className='w-full flex items-center gap-3 pl-7 pr-2 py-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left'>
				<i className='fa-solid fa-plus w-4 text-center'></i>
				<span className={tamanoTexto}>{t.noteChecklistAddItem}</span>
			</button>

			<ul className='space-y-0.5'>
				{itensOrdenados.map((item) => {
					const indice = lista.findIndex((x) => x.id === item.id);
					const arrastrando = arrastrandoId === item.id;
					return (
						<li
							key={item.id}
							data-item-id={item.id}
							className={`group flex items-center gap-2 pr-1 py-0.5 rounded-md transition-colors ${
								arrastrando ? 'bg-indigo-500/10 ring-1 ring-indigo-500/60' : ''
							}`}>
							<span
								{...propsZona(item.id)}
								title={t.dragItem}
								aria-label={t.dragItem}
								className={`w-5 h-7 shrink-0 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 select-none ${
									arrastrando ? 'cursor-grabbing' : 'cursor-grab'
								}`}>
								<i className='fa-solid fa-grip-vertical'></i>
							</span>
							<input
								type='checkbox'
								checked={Boolean(item.completado)}
								onChange={() => cambiar(item.id, { completado: !item.completado })}
								className='w-4 h-4 shrink-0 accent-indigo-600 cursor-pointer'
								aria-label={item.texto || t.noteChecklistItemPlaceholder}
							/>
							<input
								type='text'
								ref={(node) => {
									if (node) inputs.current.set(item.id, node);
									else inputs.current.delete(item.id);
								}}
								value={item.texto}
								onChange={(e) => cambiar(item.id, { texto: e.target.value })}
								onKeyDown={(e) => onKeyDown(e, item, indice)}
								placeholder={t.noteChecklistItemPlaceholder}
								className={`flex-1 min-w-0 bg-transparent outline-none py-1 ${tamanoTexto} text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
									item.completado ? 'line-through opacity-60' : ''
								}`}
							/>
							<button
								type='button'
								onClick={() => eliminar(item.id)}
								title={t.removeItem}
								aria-label={t.removeItem}
								className='w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity'>
								<i className='fa-solid fa-xmark'></i>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export const textoAElementos = (texto) =>
	String(texto || '')
		.split('\n')
		.map((liña) => liña.replace(/^\s*(?:[-*]\s*)?(?:\[(?:\s|x|X)\]|☐|☑)?\s*/, '').trim())
		.filter(Boolean)
		.map((liña) => ({ id: nanoid(), texto: liña, completado: false }));
