import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { engadirProxecto, seleccionarConfiguracionKdbx, seleccionarProxectos } from '@/Features/Projects/proxectosSlice';
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
};

export default function ProjectsView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const proxectos = useSelector(seleccionarProxectos);
	const kdbxConfig = useSelector(seleccionarConfiguracionKdbx);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const t = translations[idioma] || translations.gl;
	const [form, setForm] = useState(estadoInicialForm);
	const [proxectoSeleccionadoId, setProxectoSeleccionadoId] = useState('');
	const [kdbxEntries, setKdbxEntries] = useState([]);
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
	};

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

	return (
		<div className='space-y-6'>
			<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
				<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-5'>{t.projectsTitle}</h2>
				<form onSubmit={onSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<input
							name='nome'
							value={form.nome}
							onChange={onChange}
							required
							placeholder={t.projectName}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							name='clienteNome'
							value={form.clienteNome}
							onChange={onChange}
							required
							placeholder={t.clientName}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<input
							name='clienteTelefono'
							value={form.clienteTelefono}
							onChange={onChange}
							required
							placeholder={t.clientPhone}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
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
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<input
							name='prezoAcordado'
							value={form.prezoAcordado}
							onChange={onChange}
							required
							placeholder={t.agreedPrice}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							type='date'
							name='dataLimiteEntrega'
							value={form.dataLimiteEntrega}
							onChange={onChange}
							required
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
					</div>
					<button
						type='submit'
						className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
						{t.saveProject}
					</button>
				</form>
			</div>

			<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
				<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.projectsRegistered}</h3>
				{proxectos.length === 0 ? (
					<p className='text-sm text-gray-500 dark:text-gray-400'>{t.noProjects}</p>
				) : (
					<div className='space-y-3'>
						{proxectos.map((proxecto) => (
							<div
								key={proxecto.id}
								onClick={() => setProxectoSeleccionadoId(proxecto.id)}
								className={`border rounded-lg p-3 cursor-pointer transition-colors ${
									proxecto.id === proxectoSeleccionadoId
										? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
										: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40'
								}`}>
								<p className='font-semibold text-gray-800 dark:text-white'>{proxecto.nome}</p>
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
								<div
									key={`${entry.titulo}-${index}`}
									className='border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/40'>
									<p className='text-sm text-gray-800 dark:text-white'>
										<strong>{t.kdbxFieldTitle}:</strong> {entry.titulo || '-'}
									</p>
									<p className='text-sm text-gray-700 dark:text-gray-300'>
										<strong>{t.kdbxFieldUser}:</strong> {entry.usuario || '-'}
									</p>
									<p className='text-sm text-gray-700 dark:text-gray-300'>
										<strong>{t.kdbxFieldUrl}:</strong> {entry.url || '-'}
									</p>
									<p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
										<strong>{t.kdbxFieldNotes}:</strong> {entry.notas || '-'}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			)}

		</div>
	);
}
