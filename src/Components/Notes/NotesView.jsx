import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { AnimatePresence, motion } from 'framer-motion';
import {
	agregarNota,
	actualizarNota,
	eliminarNota,
	alternarNotaFixada,
	alternarItemListaNota,
	seleccionarNotasUsuarioActual,
} from '@/Features/Notes/notasSlice';
import { seleccionarUsuarioActualId } from '@/Features/Users/usuariosSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';

const corHexARgba = (hex, alpha = 1) => {
	const safeHex = typeof hex === 'string' ? hex.trim().replace('#', '') : '';
	if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) return `rgba(147, 51, 234, ${alpha})`;
	const r = Number.parseInt(safeHex.slice(0, 2), 16);
	const g = Number.parseInt(safeHex.slice(2, 4), 16);
	const b = Number.parseInt(safeHex.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function NotesView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActualId = useSelector(seleccionarUsuarioActualId);
	const notas = useSelector(seleccionarNotasUsuarioActual);
	const t = translations[idioma] || translations.gl;

	const [novaNota, setNovaNota] = useState({
		titulo: '',
		contido: '',
		tipo: 'texto',
		cor: '#9333ea',
		itensLista: [],
		textoLista: '',
	});
	const [editandoId, setEditandoId] = useState(null);
	const [expandidoNovaNota, setExpandidoNovaNota] = useState(false);
	const [borrador, setBorrador] = useState({
		titulo: '',
		contido: '',
		tipo: 'texto',
		cor: '#9333ea',
		itensLista: [],
		textoLista: '',
	});

	const limparNovaNota = () =>
		setNovaNota({
			titulo: '',
			contido: '',
			tipo: 'texto',
			cor: '#9333ea',
			itensLista: [],
			textoLista: '',
		});

	const LIMIADOR_CASELLA = /^\s*(?:[-*]\s*)?(?:\[(?:\s|x|X)\]|☐|☑)\s*/;

	const limparPrefixoCasilla = (liña) => String(liña || '').replace(LIMIADOR_CASELLA, '');

	const engadirPrefixoCasilla = (liña) => {
		const limpo = limparPrefixoCasilla(liña);
		return limpo.trim() ? `☐ ${limpo.trim()}` : '☐ ';
	};

	const textoConCasillas = (texto) => {
		const liñas = String(texto || '').split('\n');
		return liñas.map(engadirPrefixoCasilla).join('\n');
	};

	const inserirLiñaConCasilla = (event, value, onChange) => {
		if (event.key !== 'Enter' || event.shiftKey) return;
		event.preventDefault();
		const target = event.currentTarget;
		const inicio = target.selectionStart ?? value.length;
		const fin = target.selectionEnd ?? value.length;
		const prefixo = '☐ ';
		const seguinteValor = `${value.slice(0, inicio)}\n${prefixo}${value.slice(fin)}`;
		const novaPosicion = inicio + 1 + prefixo.length;
		onChange(seguinteValor);
		requestAnimationFrame(() => {
			target.setSelectionRange(novaPosicion, novaPosicion);
		});
	};

	const iconosTipoNota = {
		texto: 'fa-align-left',
		lista: 'fa-list-check',
	};

	// Each line in the textarea becomes one checklist item.
	const textoAItensLista = (texto, itensPrevios = []) =>
		String(texto || '')
			.split('\n')
			.map((liña) => limparPrefixoCasilla(liña).trim())
			.filter(Boolean)
			.map((liña, indice) => ({
				id: itensPrevios[indice]?.id || nanoid(),
				texto: liña,
				completado: Boolean(itensPrevios[indice]?.completado),
			}));

	const gardarNovaNota = (e) => {
		e.preventDefault();
		dispatch(
			agregarNota({
				id: nanoid(),
				usuarioId: usuarioActualId,
				titulo: novaNota.titulo,
				contido: novaNota.contido,
				tipo: novaNota.tipo,
				cor: novaNota.cor,
				itensLista:
					novaNota.tipo === 'lista' ? textoAItensLista(novaNota.textoLista, novaNota.itensLista) : [],
			})
		);
		limparNovaNota();
		setExpandidoNovaNota(false);
	};

	const comezarEdicion = (nota) => {
		setEditandoId(nota.id);
		const textoListaBase = Array.isArray(nota.itensLista) ? nota.itensLista.map((item) => item.texto).join('\n') : '';
		setBorrador({
			titulo: nota.titulo || '',
			contido: nota.contido || '',
			tipo: nota.tipo === 'lista' ? 'lista' : 'texto',
			cor: nota.cor || '#9333ea',
			itensLista: Array.isArray(nota.itensLista) ? nota.itensLista : [],
			textoLista: textoConCasillas(textoListaBase),
		});
	};

	const gardarEdicion = (id) => {
		dispatch(
			actualizarNota({
				id,
				usuarioId: usuarioActualId,
				titulo: borrador.titulo,
				contido: borrador.contido,
				tipo: borrador.tipo,
				cor: borrador.cor,
				itensLista:
					borrador.tipo === 'lista' ? textoAItensLista(borrador.textoLista, borrador.itensLista) : [],
			})
		);
		setEditandoId(null);
	};

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-4'>
				{t.addNewNote || t.addNote}
			</h2>

			<form
				onSubmit={gardarNovaNota}
				className='mb-6 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/40'>
				<div className='flex items-center mb-4 gap-3'>
					<motion.button
						type='button'
						onClick={() => setExpandidoNovaNota((v) => !v)}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='flex-none w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md'
						aria-expanded={expandidoNovaNota}
						aria-label={t.saveNote || t.addNote}>
						<i className='fa-solid fa-plus'></i>
					</motion.button>
					<input
						type='text'
						value={novaNota.titulo}
						onChange={(e) => setNovaNota((prev) => ({ ...prev, titulo: e.target.value }))}
						onClick={() => setExpandidoNovaNota(true)}
						placeholder={t.noteTitlePlaceholder}
						className='flex-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 py-2 outline-none text-gray-800 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-gray-500 min-w-0'
					/>
				</div>
				<AnimatePresence>
					{expandidoNovaNota && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.25 }}
							className='space-y-4 overflow-hidden p-4'>
							<div>
								<div className='flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
									{['texto', 'lista'].map((tipo) => (
										<label
											key={tipo}
											className={`flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer transition-colors text-sm ${
												novaNota.tipo === tipo
													? 'bg-indigo-500 text-white'
													: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
											}`}>
											<input
												type='radio'
												name='tipoNovaNota'
												value={tipo}
												checked={novaNota.tipo === tipo}
												onChange={() => {
													if (tipo === 'lista') {
														setNovaNota((prev) => ({
															...prev,
															tipo: 'lista',
															textoLista: textoConCasillas(prev.textoLista),
														}));
														return;
													}
													setNovaNota((prev) => ({ ...prev, tipo: 'texto' }));
												}}
												className='sr-only'
											/>
											<i className={`fa-solid ${iconosTipoNota[tipo]}`}></i>
											<span className='hidden sm:inline'>
												{tipo === 'texto' ? t.noteTypeText : t.noteTypeChecklist}
											</span>
										</label>
									))}
								</div>
							</div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								<i className='fa-solid fa-align-left mr-2 text-indigo-500 dark:text-indigo-400'></i>
								{t.noteContentLabel || t.noteContentPlaceholder}
							</label>
							{novaNota.tipo === 'texto' ? (
								<textarea
									value={novaNota.contido}
									onChange={(e) => setNovaNota((prev) => ({ ...prev, contido: e.target.value }))}
									placeholder={t.noteContentPlaceholder}
									rows='3'
									className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
								/>
							) : (
								<div className='space-y-2'>
									<textarea
										value={novaNota.textoLista}
										onFocus={() =>
											setNovaNota((prev) => ({
												...prev,
												textoLista: prev.textoLista ? prev.textoLista : '☐ ',
											}))
										}
										onChange={(e) =>
											setNovaNota((prev) => ({
												...prev,
												textoLista: e.target.value,
												itensLista: textoAItensLista(e.target.value, prev.itensLista),
											}))
										}
										onKeyDown={(e) =>
											inserirLiñaConCasilla(e, novaNota.textoLista, (novoTexto) =>
												setNovaNota((prev) => ({
													...prev,
													textoLista: novoTexto,
													itensLista: textoAItensLista(novoTexto, prev.itensLista),
												}))
											)
										}
										placeholder={t.noteChecklistItemPlaceholder}
										rows='5'
										className='w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
									/>
								</div>
							)}
							<div className='flex flex-wrap items-center justify-between gap-3'>
								<div className='flex items-center gap-2'>
									<input
										type='color'
										value={novaNota.cor}
										onChange={(e) => setNovaNota((prev) => ({ ...prev, cor: e.target.value }))}
										className='h-10 w-14 p-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer'
										aria-label={t.noteColor}
									/>
									<span className='text-xs text-gray-500 dark:text-gray-400'>{novaNota.cor}</span>
								</div>
								<div className='flex items-center gap-2'>
									<button
										type='button'
										onClick={() => setExpandidoNovaNota(false)}
										className='px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium'>
										{t.cancel}
									</button>
									<motion.button
										type='submit'
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className='px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium'>
										{t.saveNote || t.addNote}
									</motion.button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</form>

			{notas.length === 0 ? (
				<p className='text-gray-500 dark:text-gray-400'>{t.noNotes}</p>
			) : (
				<div className='columns-1 sm:columns-2 lg:columns-3 gap-4'>
					{notas.map((nota) => {
						const corNota = nota.cor || '#9333ea';
						const estaEditando = editandoId === nota.id;
						return (
							<motion.article
								key={nota.id}
								layout
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className='break-inside-avoid mb-4 rounded-xl p-4 border shadow-sm text-gray-900 dark:text-gray-100'
								style={{
									backgroundColor: corHexARgba(corNota, 0.18),
									borderColor: corHexARgba(corNota, 0.45),
								}}>
								<div className='flex items-center justify-between gap-2 mb-2'>
									<button
										type='button'
										onClick={() =>
											dispatch(alternarNotaFixada({ id: nota.id, usuarioId: usuarioActualId }))
										}
										className='text-xs font-medium text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white'>
										<motion.i
											className='fa-solid fa-thumbtack inline-block mr-1'
											animate={{ rotate: nota.fixada ? -12 : 0 }}
											transition={{ type: 'spring', stiffness: 260, damping: 18 }}
										/>{' '}
										{nota.fixada ? t.unpinNote : t.pinNote}
									</button>
									<div className='flex gap-2 self-end sm:self-center'>
										<motion.button
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											type='button'
											onClick={() => comezarEdicion(nota)}
											title={t.editNote}
											className='w-8 h-8 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors'>
											<i className='fa-solid fa-pen-to-square'></i>
										</motion.button>
										<motion.button
											whileHover={{ scale: 1.1, color: '#ef4444' }}
											whileTap={{ scale: 0.9 }}
											type='button'
											onClick={() => {
												dispatch(eliminarNota({ id: nota.id, usuarioId: usuarioActualId }));
											}}
											title={t.deleteNote}
											className='w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'>
											<i className='fa-solid fa-trash-can'></i>
										</motion.button>
									</div>
								</div>

								{estaEditando ? (
									<div className='space-y-2'>
										<input
											type='text'
											value={borrador.titulo}
											onChange={(e) => setBorrador((prev) => ({ ...prev, titulo: e.target.value }))}
											className='w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60'
										/>
										<div className='flex gap-2'>
											<div className='flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-full'>
												{['texto', 'lista'].map((tipo) => (
													<label
														key={tipo}
														className={`flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer transition-colors text-sm ${
															borrador.tipo === tipo
																? 'bg-indigo-500 text-white'
																: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
														}`}>
														<input
															type='radio'
															name='tipoBorradorNota'
															value={tipo}
															checked={borrador.tipo === tipo}
															onChange={() => {
																if (tipo === 'lista') {
																	setBorrador((prev) => ({
																		...prev,
																		tipo: 'lista',
																		textoLista: textoConCasillas(prev.textoLista),
																	}));
																	return;
																}
																setBorrador((prev) => ({ ...prev, tipo: 'texto' }));
															}}
															className='sr-only'
														/>
														<i className={`fa-solid ${iconosTipoNota[tipo]}`}></i>
														<span className='hidden sm:inline'>
															{tipo === 'texto' ? t.noteTypeText : t.noteTypeChecklist}
														</span>
													</label>
												))}
											</div>
										</div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
											<i className='fa-solid fa-align-left mr-2 text-indigo-500 dark:text-indigo-400'></i>
											{t.noteContentLabel || t.noteContentPlaceholder}
										</label>
										{borrador.tipo === 'texto' ? (
											<textarea
												value={borrador.contido}
												onChange={(e) => setBorrador((prev) => ({ ...prev, contido: e.target.value }))}
												rows='3'
												className='w-full mt-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 resize-none'
											/>
										) : (
											<div className='mt-1 space-y-2'>
												<textarea
													value={borrador.textoLista}
													onFocus={() =>
														setBorrador((prev) => ({
															...prev,
															textoLista: prev.textoLista ? prev.textoLista : '☐ ',
														}))
													}
													onChange={(e) =>
														setBorrador((prev) => ({
															...prev,
															textoLista: e.target.value,
															itensLista: textoAItensLista(e.target.value, prev.itensLista),
														}))
													}
													onKeyDown={(e) =>
														inserirLiñaConCasilla(e, borrador.textoLista, (novoTexto) =>
															setBorrador((prev) => ({
																...prev,
																textoLista: novoTexto,
																itensLista: textoAItensLista(novoTexto, prev.itensLista),
															}))
														)
													}
													placeholder={t.noteChecklistItemPlaceholder}
													rows='5'
													className='w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 resize-none'
												/>
											</div>
										)}
										<div className='flex items-center justify-between gap-2'>
											<div className='flex items-center gap-2'>
												<input
													type='color'
													value={borrador.cor}
													onChange={(e) => setBorrador((prev) => ({ ...prev, cor: e.target.value }))}
													className='h-8 w-11 p-1 bg-white/80 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer'
													aria-label={t.noteColor}
												/>
												<span className='text-xs text-gray-600 dark:text-gray-300'>{borrador.cor}</span>
											</div>
											<div className='flex gap-2'>
												<button
													type='button'
													onClick={() => setEditandoId(null)}
													className='px-2 py-1 rounded bg-gray-200/70 dark:bg-gray-700/70 text-xs'>
													{t.cancel}
												</button>
												<button
													type='button'
													onClick={() => gardarEdicion(nota.id)}
													className='px-2 py-1 rounded bg-indigo-600 text-white text-xs'>
													{t.save}
												</button>
											</div>
										</div>
									</div>
								) : (
									<div>
										{nota.titulo && <h3 className='font-semibold text-base mb-1'>{nota.titulo}</h3>}
										{nota.tipo !== 'lista' && nota.contido && (
											<p className='text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100'>
												{nota.contido}
											</p>
										)}
										{nota.tipo === 'lista' && (
											<ul className='space-y-1'>
												{(nota.itensLista || []).map((item) => (
													<li key={item.id} className='flex items-center gap-2 text-sm'>
														<input
															type='checkbox'
															checked={Boolean(item.completado)}
															onChange={() =>
																dispatch(
																	alternarItemListaNota({
																		id: nota.id,
																		usuarioId: usuarioActualId,
																		itemId: item.id,
																	})
																)
															}
															className='accent-indigo-600'
														/>
														<span className={item.completado ? 'line-through opacity-85' : ''}>
															{item.texto}
														</span>
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</motion.article>
						);
					})}
				</div>
			)}
		</div>
	);
}
