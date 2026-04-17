import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import {
	eliminarUsuario,
	rexistrarUsuario,
	seleccionarUsuarioActualAdmin,
	seleccionarUsuarioActual,
	seleccionarUsuarios,
} from '@/Features/Users/usuariosSlice';
import { translations, languageNames } from '@/i18n/translations';

export default function OptionsUsersView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActual = useSelector(seleccionarUsuarioActual);
	const usuarios = useSelector(seleccionarUsuarios);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const t = translations[idioma] || translations.gl;

	const [novoUsuario, setNovoUsuario] = useState({
		id: '',
		nome: '',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'claro',
		xenero: 'F',
		imaxePerfil: '',
		admin: '0',
	});

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

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-6'>{t.optionsUserCreationTitle}</h2>
			{!eAdmin && (
				<p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>{t.optionsAdminOnlyHint}</p>
			)}

			{eAdmin && (
				<div>
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

					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.adminUsersTitle}</h3>
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
