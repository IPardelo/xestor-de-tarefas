import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import {
	actualizarPreferenciasUsuarioActual,
	eliminarUsuario,
	rexistrarUsuario,
	seleccionarUsuarioActualAdmin,
	seleccionarUsuarioActual,
	seleccionarUsuarios,
} from '@/Features/Users/usuariosSlice';
import {
	actualizarConfiguracionKdbx,
	seleccionarConfiguracionKdbx,
} from '@/Features/Projects/proxectosSlice';
import { translations, languageNames } from '@/i18n/translations';

export default function OptionsView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActual = useSelector(seleccionarUsuarioActual);
	const usuarios = useSelector(seleccionarUsuarios);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const kdbxConfig = useSelector(seleccionarConfiguracionKdbx);
	const t = translations[idioma] || translations.gl;

	const [form, setForm] = useState({
		imaxePerfil: '',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'claro',
		xenero: 'F',
	});
	const [novoUsuario, setNovoUsuario] = useState({
		id: '',
		nome: '',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'claro',
		xenero: 'F',
		imaxePerfil: '',
		admin: '0',
	});
	const [kdbxForm, setKdbxForm] = useState({
		filePath: 'kdbx\\Database.kdbx',
		password: '1234567890',
	});

	useEffect(() => {
		if (!usuarioActual) return;
		setForm({
			imaxePerfil: usuarioActual.imaxePerfil || '',
			idiomaPredeterminado: usuarioActual.idiomaPredeterminado || 'gl',
			temaPredeterminado: usuarioActual.temaPredeterminado || 'claro',
			xenero: usuarioActual.xenero || 'F',
		});
	}, [usuarioActual]);

	useEffect(() => {
		setKdbxForm({
			filePath: kdbxConfig?.filePath || 'kdbx\\Database.kdbx',
			password: kdbxConfig?.password || '1234567890',
		});
	}, [kdbxConfig]);

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = (e) => {
		e.preventDefault();
		dispatch(actualizarPreferenciasUsuarioActual(form));
	};

	const onNovoUsuarioChange = (e) => {
		const { name, value } = e.target;
		setNovoUsuario((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmitNovoUsuario = (e) => {
		e.preventDefault();
		dispatch(rexistrarUsuario(novoUsuario));
		setNovoUsuario({
			id: '',
			nome: '',
			idiomaPredeterminado: 'gl',
			temaPredeterminado: 'claro',
			xenero: 'F',
			imaxePerfil: '',
			admin: '0',
		});
	};

	const onKdbxChange = (e) => {
		const { name, value } = e.target;
		setKdbxForm((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmitKdbxConfig = (e) => {
		e.preventDefault();
		dispatch(actualizarConfiguracionKdbx(kdbxForm));
	};

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-6'>{t.optionsTitle}</h2>
			<form onSubmit={onSubmit} className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
						{t.profileImage}
					</label>
					<input
						type='text'
						name='imaxePerfil'
						value={form.imaxePerfil}
						onChange={onChange}
						placeholder='https://...'
						className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
					/>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							{t.defaultLanguage}
						</label>
						<select
							name='idiomaPredeterminado'
							value={form.idiomaPredeterminado}
							onChange={onChange}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
							<option value='gl'>{languageNames.gl}</option>
							<option value='es'>{languageNames.es}</option>
							<option value='en'>{languageNames.en}</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							{t.defaultTheme}
						</label>
						<select
							name='temaPredeterminado'
							value={form.temaPredeterminado}
							onChange={onChange}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
							<option value='claro'>{t.themeLightLabel}</option>
							<option value='oscuro'>{t.themeDarkLabel}</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							{t.genderShort}
						</label>
						<select
							name='xenero'
							value={form.xenero}
							onChange={onChange}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
							<option value='M'>{t.genderMasculine}</option>
							<option value='F'>{t.genderFeminine}</option>
						</select>
					</div>
				</div>

				<div className='pt-2'>
					<button
						type='submit'
						className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
						{t.saveOptions}
					</button>
				</div>
			</form>

			{eAdmin && (
				<div className='mt-8 border-t border-gray-200 dark:border-gray-700 pt-6'>
					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.kdbxConfigTitle}</h3>
					<form onSubmit={onSubmitKdbxConfig} className='space-y-3 mb-6'>
						<input
							type='text'
							name='filePath'
							value={kdbxForm.filePath}
							onChange={onKdbxChange}
							placeholder={t.kdbxPath}
							required
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							type='password'
							name='password'
							value={kdbxForm.password}
							onChange={onKdbxChange}
							placeholder={t.kdbxPassword}
							required
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<button
							type='submit'
							className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
							{t.saveKdbxConfig}
						</button>
					</form>

					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.adminUsersTitle}</h3>

					<form onSubmit={onSubmitNovoUsuario} className='space-y-3 mb-6'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							<input
								type='text'
								name='id'
								value={novoUsuario.id}
								onChange={onNovoUsuarioChange}
								placeholder={t.userId}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								required
							/>
							<input
								type='text'
								name='nome'
								value={novoUsuario.nome}
								onChange={onNovoUsuarioChange}
								placeholder={t.userName}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								required
							/>
						</div>
						<div className='grid grid-cols-1 sm:grid-cols-5 gap-3'>
							<select
								name='idiomaPredeterminado'
								value={novoUsuario.idiomaPredeterminado}
								onChange={onNovoUsuarioChange}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
								<option value='gl'>{languageNames.gl}</option>
								<option value='es'>{languageNames.es}</option>
								<option value='en'>{languageNames.en}</option>
							</select>
							<select
								name='temaPredeterminado'
								value={novoUsuario.temaPredeterminado}
								onChange={onNovoUsuarioChange}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
								<option value='claro'>{t.themeLightLabel}</option>
								<option value='oscuro'>{t.themeDarkLabel}</option>
							</select>
							<select
								name='xenero'
								value={novoUsuario.xenero}
								onChange={onNovoUsuarioChange}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
								<option value='M'>{t.genderMasculine}</option>
								<option value='F'>{t.genderFeminine}</option>
							</select>
							<select
								name='admin'
								value={novoUsuario.admin}
								onChange={onNovoUsuarioChange}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
								<option value='0'>
									{t.adminLabel}: {t.adminNo}
								</option>
								<option value='1'>
									{t.adminLabel}: {t.adminYes}
								</option>
							</select>
							<input
								type='text'
								name='imaxePerfil'
								value={novoUsuario.imaxePerfil}
								onChange={onNovoUsuarioChange}
								placeholder={t.profileImage}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
							/>
						</div>
						<button
							type='submit'
							className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
							{t.createUser}
						</button>
					</form>

					<div className='space-y-2'>
						{usuarios.map((usuario) => (
							<div
								key={usuario.id}
								className='flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2'>
								<div className='min-w-0'>
									<p className='text-sm font-medium text-gray-800 dark:text-white truncate'>{usuario.nome}</p>
									<p className='text-xs text-gray-500 dark:text-gray-400'>
										{usuario.id} - {t.adminLabel}: {usuario.admin === '1' ? t.adminYes : t.adminNo}
									</p>
								</div>
								<button
									type='button'
									disabled={usuario.id === 'ismael' || usuario.id === usuarioActual?.id}
									onClick={() => dispatch(eliminarUsuario(usuario.id))}
									className='px-3 py-1.5 text-xs rounded-md bg-red-500 text-white disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-gray-600 dark:disabled:text-gray-300'>
									{t.deleteUser}
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
