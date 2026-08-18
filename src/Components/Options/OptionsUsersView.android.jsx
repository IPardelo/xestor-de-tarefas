import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import {
	ID_USUARIO_PROTEXIDO,
	actualizarUsuario,
	eliminarUsuario,
	rexistrarUsuario,
	seleccionarUsuarioActualAdmin,
	seleccionarUsuarioActual,
	seleccionarUsuarios,
} from '@/Features/Users/usuariosSlice';
import { translations, languageNames } from '@/i18n/translations';
import { showToast } from '@/Utils/toast';

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
		contrasenha: '',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'claro',
		xenero: 'F',
		imaxePerfil: '',
		admin: '0',
	});
	const [usuarioEditandoId, setUsuarioEditandoId] = useState('');
	const [formEditar, setFormEditar] = useState({
		nome: '',
		contrasenha: '',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'claro',
		xenero: 'F',
		imaxePerfil: '',
		admin: '0',
	});
	const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

	const onNovoUsuarioChange = (e) => {
		const { name, value } = e.target;
		setNovoUsuario((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmitNovoUsuario = (e) => {
		e.preventDefault();
		dispatch(rexistrarUsuario(novoUsuario));
		showToast(t.toastUserSaved);
		setNovoUsuario({
			id: '',
			nome: '',
			contrasenha: '',
			idiomaPredeterminado: 'gl',
			temaPredeterminado: 'claro',
			xenero: 'F',
			imaxePerfil: '',
			admin: '0',
		});
	};

	const iniciarEdicion = (usuario) => {
		setUsuarioEditandoId(usuario.id);
		setFormEditar({
			nome: usuario.nome || '',
			contrasenha: usuario.contrasenha || '',
			idiomaPredeterminado: usuario.idiomaPredeterminado || 'gl',
			temaPredeterminado: usuario.temaPredeterminado || 'claro',
			xenero: usuario.xenero || 'F',
			imaxePerfil: usuario.imaxePerfil || '',
			admin: usuario.admin || '0',
		});
	};

	const cancelarEdicion = () => {
		setUsuarioEditandoId('');
		setFormEditar({
			nome: '',
			contrasenha: '',
			idiomaPredeterminado: 'gl',
			temaPredeterminado: 'claro',
			xenero: 'F',
			imaxePerfil: '',
			admin: '0',
		});
	};

	const gardarEdicion = (e, id) => {
		e.preventDefault();
		dispatch(actualizarUsuario({ idOriginal: id, id, ...formEditar }));
		cancelarEdicion();
		showToast(t.toastUserSaved);
	};

	const confirmarEliminarUsuario = () => {
		if (!usuarioAEliminar) return;
		dispatch(eliminarUsuario(usuarioAEliminar.id));
		setUsuarioAEliminar(null);
		cancelarEdicion();
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
							<input
								type='password'
								name='contrasenha'
								value={novoUsuario.contrasenha}
								onChange={onNovoUsuarioChange}
								placeholder={t.loginPassword}
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
						<div className='flex justify-end pt-1'>
							<button
								type='submit'
								className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
								{t.createUser}
							</button>
						</div>
					</form>

					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.adminUsersTitle}</h3>
					<div className='space-y-2'>
						{usuarios.map((usuario) => (
							<div
								key={usuario.id}
								className='group relative bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2'>
								<div
									className={`absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 ${
										usuarioEditandoId === usuario.id ? 'hidden' : ''
									}`}>
									<button
										type='button'
										onClick={() => iniciarEdicion(usuario)}
										className='w-8 h-8 rounded-full text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
										aria-label={t.editUser}
										title={t.editUser}>
										<i className='fa-solid fa-pen-to-square'></i>
									</button>
								</div>
								{usuarioEditandoId === usuario.id ? (
									<form onSubmit={(e) => gardarEdicion(e, usuario.id)} className='space-y-2 pr-10'>
										<button
											type='button'
											onClick={cancelarEdicion}
											className='absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 rounded-full text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
											aria-label={t.cancel}
											title={t.cancel}>
											<i className='fa-solid fa-xmark'></i>
										</button>
										<input
											type='text'
											value={formEditar.nome}
											onChange={(e) => setFormEditar((prev) => ({ ...prev, nome: e.target.value }))}
											placeholder={t.userName}
											required
											className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
										/>
										<input
											type='password'
											value={formEditar.contrasenha}
											onChange={(e) =>
												setFormEditar((prev) => ({ ...prev, contrasenha: e.target.value }))
											}
											placeholder={t.loginPassword}
											className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
										/>
										<div className='grid grid-cols-1 sm:grid-cols-4 gap-2'>
											<select
												value={formEditar.idiomaPredeterminado}
												onChange={(e) =>
													setFormEditar((prev) => ({
														...prev,
														idiomaPredeterminado: e.target.value,
													}))
												}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
												<option value='gl'>{languageNames.gl}</option>
												<option value='es'>{languageNames.es}</option>
												<option value='en'>{languageNames.en}</option>
											</select>
											<select
												value={formEditar.temaPredeterminado}
												onChange={(e) =>
													setFormEditar((prev) => ({
														...prev,
														temaPredeterminado: e.target.value,
													}))
												}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
												<option value='claro'>{t.themeLightLabel}</option>
												<option value='oscuro'>{t.themeDarkLabel}</option>
											</select>
											<select
												value={formEditar.xenero}
												onChange={(e) => setFormEditar((prev) => ({ ...prev, xenero: e.target.value }))}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
												<option value='M'>{t.genderMasculine}</option>
												<option value='F'>{t.genderFeminine}</option>
											</select>
											<select
												value={formEditar.admin}
												onChange={(e) => setFormEditar((prev) => ({ ...prev, admin: e.target.value }))}
												disabled={usuario.id === ID_USUARIO_PROTEXIDO}
												className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white disabled:opacity-60'>
												<option value='0'>
													{t.adminLabel}: {t.adminNo}
												</option>
												<option value='1'>
													{t.adminLabel}: {t.adminYes}
												</option>
											</select>
										</div>
										<input
											type='text'
											value={formEditar.imaxePerfil}
											onChange={(e) =>
												setFormEditar((prev) => ({ ...prev, imaxePerfil: e.target.value }))
											}
											placeholder={t.profileImage}
											className='w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
										/>
										<div className='flex justify-end gap-2'>
											<button
												type='button'
												disabled={usuario.id === ID_USUARIO_PROTEXIDO || usuario.id === usuarioActual?.id}
												onClick={() => setUsuarioAEliminar(usuario)}
												className='px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
												{t.deleteUser}
											</button>
											<button
												type='submit'
												className='px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow transition-shadow'>
												{t.saveChanges}
											</button>
										</div>
									</form>
								) : (
									<div className='min-w-0 pr-10'>
										<p className='text-sm font-medium text-gray-800 dark:text-white truncate'>{usuario.nome}</p>
										<p className='text-xs text-gray-500 dark:text-gray-400'>
											{usuario.id} - {t.adminLabel}: {usuario.admin === '1' ? t.adminYes : t.adminNo}
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
			{usuarioAEliminar ? (
				<div className='fixed inset-0 z-40 flex items-center justify-center p-4'>
					<div
						className='absolute inset-0 bg-black/45'
						onClick={() => setUsuarioAEliminar(null)}
					/>
					<div className='relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-5'>
						<h4 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
							{t.deleteUser}
						</h4>
						<p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
							{t.deleteUserConfirmBody || `${t.deleteUser}: ${usuarioAEliminar.nome}`}
						</p>
						<div className='flex justify-end gap-2'>
							<button
								type='button'
								onClick={() => setUsuarioAEliminar(null)}
								className='px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
								{t.cancel}
							</button>
							<button
								type='button'
								onClick={confirmarEliminarUsuario}
								className='px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'>
								{t.deleteUser}
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
