import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
	actualizarProxecto,
	engadirProxecto,
	eliminarProxecto,
	seleccionarConfiguracionKdbx,
	seleccionarProxectos,
} from '@/Features/Projects/proxectosSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';
import { seleccionarUsuarioActualAdmin } from '@/Features/Users/usuariosSlice';

const estadoInicialForm = {
	nome: '',
	clienteNome: '',
	clienteTelefono: '',
	clienteEmail: '',
	prezoAcordado: '',
	dataLimiteEntrega: '',
	cor: '#9333ea',
};

const tenValor = (valor) => valor !== null && valor !== undefined && String(valor).trim() !== '';

export default function ProjectsView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const proxectos = useSelector(seleccionarProxectos);
	const kdbxConfig = useSelector(seleccionarConfiguracionKdbx);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const t = translations[idioma] || translations.gl;
	const [form, setForm] = useState(estadoInicialForm);
	const [expandido, setExpandido] = useState(false);
	const [formEditar, setFormEditar] = useState(estadoInicialForm);
	const [proxectoEditandoId, setProxectoEditandoId] = useState('');
	const [proxectoAEliminar, setProxectoAEliminar] = useState(null);
	const [textoConfirmacionEliminar, setTextoConfirmacionEliminar] = useState('');
	const [proxectoSeleccionadoId, setProxectoSeleccionadoId] = useState('');
	const [kdbxEntries, setKdbxEntries] = useState([]);
	const [contrasinaisVisibles, setContrasinaisVisibles] = useState({});
	const [kdbxLoading, setKdbxLoading] = useState(false);
	const [kdbxErro, setKdbxErro] = useState('');

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = (e) => {
		e.preventDefault();
		dispatch(engadirProxecto(form));
		setForm(estadoInicialForm);
		setExpandido(false);
	};

	const onChangeEditar = (e) => {
		const { name, value } = e.target;
		setFormEditar((prev) => ({ ...prev, [name]: value }));
	};

	const iniciarEdicion = (proxecto) => {
		setProxectoEditandoId(proxecto.id);
		setFormEditar({
			nome: proxecto.nome || '',
			clienteNome: proxecto.clienteNome || '',
			clienteTelefono: proxecto.clienteTelefono || '',
			clienteEmail: proxecto.clienteEmail || '',
			prezoAcordado: proxecto.prezoAcordado || '',
			dataLimiteEntrega: proxecto.dataLimiteEntrega || '',
			cor: proxecto.cor || '#9333ea',
		});
	};

	const cancelarEdicion = () => {
		setProxectoEditandoId('');
		setFormEditar(estadoInicialForm);
	};

	const gardarEdicion = (e, proxectoId) => {
		e.preventDefault();
		dispatch(actualizarProxecto({ id: proxectoId, ...formEditar }));
		cancelarEdicion();
	};

	const abrirModalEliminar = (proxecto) => {
		setProxectoAEliminar(proxecto);
		setTextoConfirmacionEliminar('');
	};

	const cancelarEliminar = () => {
		setProxectoAEliminar(null);
		setTextoConfirmacionEliminar('');
	};

	const confirmarEliminar = () => {
		if (!proxectoAEliminar) return;
		dispatch(eliminarProxecto(proxectoAEliminar.id));
		if (proxectoSeleccionadoId === proxectoAEliminar.id) {
			setProxectoSeleccionadoId('');
		}
		if (proxectoEditandoId === proxectoAEliminar.id) {
			cancelarEdicion();
		}
		cancelarEliminar();
	};

	const fraseConfirmacion = proxectoAEliminar
		? `${t.deleteProjectConfirmKeyword} ${proxectoAEliminar.nome}`
		: '';
	const podeEliminar = textoConfirmacionEliminar.trim() === fraseConfirmacion;

	const proxectoSeleccionado = proxectos.find((p) => p.id === proxectoSeleccionadoId) || null;
	const rexistrosProxectoSeleccionado = proxectoSeleccionado
		? kdbxEntries.filter((entry) => entry.grupo?.trim() === proxectoSeleccionado.nome?.trim())
		: [];

	useEffect(() => {
		if (!proxectoSeleccionado) return;
		if (!eAdmin) {
			setKdbxEntries([]);
			setKdbxErro(t.kdbxAdminOnly);
			return;
		}

		const cargarKdbx = async () => {
			setKdbxLoading(true);
			setKdbxErro('');
			try {
				const resp = await fetch('/api/kdbx/read', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						filePath: kdbxConfig?.filePath,
						password: kdbxConfig?.password,
					}),
				});
				const data = await resp.json();
				if (!resp.ok) throw new Error(data?.error || t.kdbxReadError);
				setKdbxEntries(Array.isArray(data.entries) ? data.entries : []);
			} catch (error) {
				setKdbxEntries([]);
				setKdbxErro(error?.message || t.kdbxReadError);
			} finally {
				setKdbxLoading(false);
			}
		};

		cargarKdbx();
	}, [proxectoSeleccionado, eAdmin, kdbxConfig?.filePath, kdbxConfig?.password, t.kdbxAdminOnly, t.kdbxReadError]);

	useEffect(() => {
		setContrasinaisVisibles({});
	}, [proxectoSeleccionadoId]);

	return (
		<div className='space-y-6'>
			<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
				<h2 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4'>{t.projectsTitle}</h2>
				<form
					onSubmit={onSubmit}
					className='bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-10 sm:p-5 transition-all duration-300 space-y-4'>
					<div className='flex items-center mb-4 gap-3'>
						<motion.button
							type='button'
							onClick={() => setExpandido((v) => !v)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='flex-none w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md'
							aria-expanded={expandido}
							aria-label={t.saveProject}>
							<i className='fa-solid fa-plus'></i>
						</motion.button>
						<input
							name='nome'
							value={form.nome}
							onChange={onChange}
							onClick={() => setExpandido(true)}
							required
							placeholder={t.projectName}
							className='flex-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 py-2 outline-none text-gray-800 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-gray-500 min-w-0'
						/>
					</div>
					<AnimatePresence>
						{expandido && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.3 }}
								className='space-y-4 overflow-hidden'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
										<i className='fa-solid fa-user mr-2 text-indigo-500 dark:text-indigo-400'></i>
										{t.clientName}
									</label>
									<input
										name='clienteNome'
										value={form.clienteNome}
										onChange={onChange}
										required
										placeholder={t.clientName}
										className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
										<i className='fa-solid fa-phone mr-2 text-indigo-500 dark:text-indigo-400'></i>
										{t.clientPhone}
									</label>
									<input
										name='clienteTelefono'
										value={form.clienteTelefono}
										onChange={onChange}
										required
										placeholder={t.clientPhone}
										className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
									/>
								</div>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
										<i className='fa-solid fa-envelope mr-2 text-indigo-500 dark:text-indigo-400'></i>
										{t.clientEmail}
									</label>
									<input
										type='email'
										name='clienteEmail'
										value={form.clienteEmail}
										onChange={onChange}
										required
										placeholder={t.clientEmail}
										className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
										<i className='fa-solid fa-euro-sign mr-2 text-indigo-500 dark:text-indigo-400'></i>
										{t.agreedPrice}
									</label>
									<input
										name='prezoAcordado'
										value={form.prezoAcordado}
										onChange={onChange}
										required
										placeholder={t.agreedPrice}
										className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
									/>
								</div>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
										<i className='fa-solid fa-calendar-days mr-2 text-indigo-500 dark:text-indigo-400'></i>
										{t.deliveryDeadline}
									</label>
									<input
										type='date'
										name='dataLimiteEntrega'
										value={form.dataLimiteEntrega}
										onChange={onChange}
										required
										className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
									/>
								</div>
								<div className='flex items-end gap-3 sm:justify-start'>
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
											<i className='fa-solid fa-palette mr-2 text-indigo-500 dark:text-indigo-400'></i>
											{t.projectColor}
										</label>
										<div className='flex items-center gap-2'>
											<input
												type='color'
												name='cor'
												value={form.cor}
												onChange={onChange}
												className='h-10 w-14 p-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer'
												aria-label={t.projectColor}
											/>
											<span className='text-xs text-gray-500 dark:text-gray-400'>{form.cor}</span>
										</div>
									</div>
								</div>
							</div>
							<div className='flex justify-end pt-2 gap-2'>
								<button
									type='button'
									onClick={() => setExpandido(false)}
									className='px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm'>
									{t.cancel}
								</button>
								<button
									type='submit'
									className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
									{t.saveProject}
								</button>
							</div>
							</motion.div>
						)}
					</AnimatePresence>
				</form>
			</div>

			<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
				<h3 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4'>
					{t.projectsRegistered}
				</h3>
				{proxectos.length === 0 ? (
					<p className='text-sm text-gray-500 dark:text-gray-400'>{t.noProjects}</p>
				) : (
					<div className='space-y-3'>
						{proxectos.map((proxecto) => (
							<div
								key={proxecto.id}
								onClick={() => setProxectoSeleccionadoId(proxecto.id)}
								className={`group relative border rounded-lg p-3 cursor-pointer transition-colors ${
									proxecto.id === proxectoSeleccionadoId
										? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
										: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40'
								}`}>
								<div
									className={`absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 ${
										proxectoEditandoId === proxecto.id ? 'hidden' : ''
									}`}>
									<button
										type='button'
										onClick={(e) => {
											e.stopPropagation();
											iniciarEdicion(proxecto);
										}}
										className={`w-8 h-8 rounded-full hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors ${
											proxectoEditandoId === proxecto.id
												? 'opacity-100 text-amber-500'
												: 'opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400'
										}`}
										aria-label={t.editProject}
										title={t.editProject}>
										<i className='fa-solid fa-pen-to-square'></i>
									</button>
									<button
										type='button'
										onClick={(e) => {
											e.stopPropagation();
											abrirModalEliminar(proxecto);
										}}
										className='w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
										aria-label={t.deleteProject}
										title={t.deleteProject}>
										<i className='fa-solid fa-trash-can'></i>
									</button>
								</div>
								{proxectoEditandoId === proxecto.id ? (
									<form
										onSubmit={(e) => gardarEdicion(e, proxecto.id)}
										onClick={(e) => e.stopPropagation()}
										className='space-y-2 pr-10'>
										<input
											name='nome'
											value={formEditar.nome}
											onChange={onChangeEditar}
											required
											placeholder={t.projectName}
											className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
										/>
										<input
											name='clienteNome'
											value={formEditar.clienteNome}
											onChange={onChangeEditar}
											required
											placeholder={t.clientName}
											className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
										/>
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
											<input
												name='clienteTelefono'
												value={formEditar.clienteTelefono}
												onChange={onChangeEditar}
												required
												placeholder={t.clientPhone}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
											/>
											<input
												type='email'
												name='clienteEmail'
												value={formEditar.clienteEmail}
												onChange={onChangeEditar}
												required
												placeholder={t.clientEmail}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
											/>
										</div>
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
											<input
												name='prezoAcordado'
												value={formEditar.prezoAcordado}
												onChange={onChangeEditar}
												required
												placeholder={t.agreedPrice}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
											/>
											<input
												type='date'
												name='dataLimiteEntrega'
												value={formEditar.dataLimiteEntrega}
												onChange={onChangeEditar}
												required
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
											/>
										</div>
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 items-end'>
											<div className='flex items-center gap-3'>
												<label className='text-xs font-medium text-gray-700 dark:text-gray-300'>
													{t.projectColor}
												</label>
												<input
													type='color'
													name='cor'
													value={formEditar.cor}
													onChange={onChangeEditar}
													className='h-9 w-12 p-1 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer'
													aria-label={t.projectColor}
												/>
												<span className='text-xs text-gray-500 dark:text-gray-400'>{formEditar.cor}</span>
											</div>
										</div>
										<div className='flex justify-end gap-2 pt-1'>
											<button
												type='button'
												onClick={cancelarEdicion}
												className='px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
												{t.cancel}
											</button>
											<button
												type='submit'
												className='px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow transition-shadow'>
												{t.saveChanges}
											</button>
										</div>
									</form>
								) : (
									<>
										<p className='font-semibold text-gray-800 dark:text-white flex items-center gap-2'>
											<span
												className='inline-block w-2.5 h-2.5 rounded-full'
												style={{ backgroundColor: proxecto.cor || '#9333ea' }}
											/>
											{proxecto.nome}
										</p>
										<p className='text-sm text-gray-600 dark:text-gray-300'>
											{t.clientName}: {proxecto.clienteNome}
										</p>
										<p className='text-sm text-gray-600 dark:text-gray-300'>
											{t.clientPhone}: {proxecto.clienteTelefono}
										</p>
										<p className='text-sm text-gray-600 dark:text-gray-300'>
											{t.clientEmail}: {proxecto.clienteEmail}
										</p>
										<p className='text-sm text-gray-600 dark:text-gray-300'>
											{t.agreedPrice}: {proxecto.prezoAcordado}
										</p>
										<p className='text-sm text-gray-600 dark:text-gray-300'>
											{t.deliveryDeadline}: {proxecto.dataLimiteEntrega}
										</p>
									</>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{proxectoSeleccionado && (
				<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-3'>
						{t.projectLinkedRecords}: {proxectoSeleccionado.nome}
					</h3>
					<p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
						{t.projectGroupLabel}: <strong>{proxectoSeleccionado.nome}</strong>
					</p>
					{kdbxLoading && <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>{t.kdbxReading}</p>}
					{kdbxErro && <p className='text-sm text-red-500 mb-3'>{kdbxErro}</p>}
					{rexistrosProxectoSeleccionado.length === 0 ? (
						<p className='text-sm text-gray-500 dark:text-gray-400'>{t.noProjectLinkedRecords}</p>
					) : (
						<div className='space-y-2'>
							{rexistrosProxectoSeleccionado.map((entry, index) => (
								// Cada rexistro ten o seu propio estado de mostrar/ocultar contrasinal.
								// Reiníciase cando cambias de proxecto seleccionado.
								(() => {
									const entryKey = `${entry.titulo || 'sen-titulo'}-${index}`;
									const passwordVisible = !!contrasinaisVisibles[entryKey];
									const tenTitulo = tenValor(entry.titulo);
									const tenUsuario = tenValor(entry.usuario);
									const tenPassword = tenValor(entry.password);
									const tenUrl = tenValor(entry.url);
									const tenNotas = tenValor(entry.notas);
									return (
								<div
									key={entryKey}
									className='relative border border-gray-200 dark:border-gray-700 rounded-lg p-3 pr-10 bg-gray-50 dark:bg-gray-700/40'>
									{tenPassword ? (
										<button
											type='button'
											onClick={() =>
												setContrasinaisVisibles((prev) => ({
													...prev,
													[entryKey]: !prev[entryKey],
												}))
											}
											className='absolute top-2 right-2 w-7 h-7 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors'
											aria-label={passwordVisible ? t.kdbxHidePassword : t.kdbxShowPassword}
											title={passwordVisible ? t.kdbxHidePassword : t.kdbxShowPassword}>
											<i className={`fa-solid ${passwordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
										</button>
									) : null}
									{tenTitulo && (
										<p className='text-sm text-gray-800 dark:text-white'>
											<strong>{t.kdbxFieldTitle}:</strong> {entry.titulo}
										</p>
									)}
									{tenUsuario && (
										<p className='text-sm text-gray-700 dark:text-gray-300'>
											<strong>{t.kdbxFieldUser}:</strong> {entry.usuario}
										</p>
									)}
									{tenPassword && (
										<p className='text-sm text-gray-700 dark:text-gray-300'>
											<strong>{t.kdbxFieldPassword}:</strong>{' '}
											{passwordVisible ? entry.password : '••••••••'}
										</p>
									)}
									{tenUrl && (
										<p className='text-sm text-gray-700 dark:text-gray-300'>
											<strong>{t.kdbxFieldUrl}:</strong> {entry.url}
										</p>
									)}
									{tenNotas && (
										<p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
											<strong>{t.kdbxFieldNotes}:</strong> {entry.notas}
										</p>
									)}
								</div>
									);
								})()
							))}
						</div>
					)}
				</div>
			)}

			{proxectoAEliminar && (
				<div className='fixed inset-0 z-40 flex items-center justify-center p-4'>
					<div className='absolute inset-0 bg-black/45' onClick={cancelarEliminar} />
					<div className='relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-5'>
						<h4 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
							{t.deleteProjectConfirmTitle}
						</h4>
						<p className='text-sm text-gray-600 dark:text-gray-300 mb-2'>{t.deleteProjectConfirmBody}</p>
						<p className='text-sm font-semibold text-red-600 dark:text-red-400 mb-3 break-words'>
							{fraseConfirmacion}
						</p>
						<input
							value={textoConfirmacionEliminar}
							onChange={(e) => setTextoConfirmacionEliminar(e.target.value)}
							placeholder={t.deleteProjectConfirmPlaceholder}
							className='w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white mb-4'
						/>
						<div className='flex justify-end gap-2'>
							<button
								type='button'
								onClick={cancelarEliminar}
								className='px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
								{t.cancel}
							</button>
							<button
								type='button'
								onClick={confirmarEliminar}
								disabled={!podeEliminar}
								className='px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
								{t.deleteProjectConfirmAction}
							</button>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
