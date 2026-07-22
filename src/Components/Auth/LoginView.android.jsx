import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	cambiarContrasinalDesdeLogin,
	iniciarSesion,
	rexistrarUsuarioDesdeLogin,
	seleccionarUsuarios,
} from '@/Features/Users/usuariosSlice';
import { validarCredenciais } from '@/App/autenticacion';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';
import { showToast } from '@/Utils/toast';

export default function LoginView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const [erroInicioSesion, setErroInicioSesion] = useState(false);
	const [validando, setValidando] = useState(false);
	const usuarios = useSelector(seleccionarUsuarios);
	const t = translations[idioma] || translations.gl;
	const [form, setForm] = useState({ id: '', contrasenha: '' });
	const [modoAxuda, setModoAxuda] = useState('');
	const [erroSecundario, setErroSecundario] = useState('');
	const [formCrearConta, setFormCrearConta] = useState({ id: '', nome: '', contrasenha: '' });
	const [formCambiarContrasinal, setFormCambiarContrasinal] = useState({
		id: '',
		contrasenhaActual: '',
		contrasenhaNova: '',
	});

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		setValidando(true);
		try {
			const usuario = await validarCredenciais(form.id.trim(), form.contrasenha, usuarios);
			setErroInicioSesion(!usuario);
			if (usuario) dispatch(iniciarSesion(usuario.id));
		} catch {
			setErroInicioSesion(true);
		} finally {
			setValidando(false);
		}
	};

	const onSubmitCrearConta = (e) => {
		e.preventDefault();
		const id = formCrearConta.id.trim();
		const nome = formCrearConta.nome.trim();
		const contrasenha = formCrearConta.contrasenha.trim();
		if (!id || !nome || !contrasenha) return;
		if (usuarios.some((u) => u.id === id)) {
			setErroSecundario(t.loginCreateAccountExists);
			return;
		}
		dispatch(rexistrarUsuarioDesdeLogin({ id, nome, contrasenha }));
		setErroSecundario('');
		showToast(t.loginCreateAccountSuccess);
		setFormCrearConta({ id: '', nome: '', contrasenha: '' });
		setModoAxuda('');
	};

	const onSubmitCambiarContrasinal = (e) => {
		e.preventDefault();
		const id = formCambiarContrasinal.id.trim();
		const contrasenhaActual = formCambiarContrasinal.contrasenhaActual.trim();
		const contrasenhaNova = formCambiarContrasinal.contrasenhaNova.trim();
		const usuario = usuarios.find((u) => u.id === id);
		if (!usuario) {
			setErroSecundario(t.loginUserNotFound);
			return;
		}
		if (!contrasenhaNova) {
			setErroSecundario(t.passwordNewRequired);
			return;
		}
		if ((usuario.contrasenha || '').trim() !== contrasenhaActual) {
			setErroSecundario(t.passwordCurrentInvalid);
			return;
		}
		dispatch(cambiarContrasinalDesdeLogin({ id, contrasenhaActual, novaContrasenha: contrasenhaNova }));
		setErroSecundario('');
		showToast(t.passwordUpdated);
		setFormCambiarContrasinal({ id: '', contrasenhaActual: '', contrasenhaNova: '' });
		setModoAxuda('');
	};

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4'>
			<div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8'>
				<h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-6'>{t.loginTitle}</h1>
				<form onSubmit={onSubmit} className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							{t.loginUserId}
						</label>
						<input
							type='text'
							name='id'
							value={form.id}
							onChange={onChange}
							required
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							{t.loginPassword}
						</label>
						<input
							type='password'
							name='contrasenha'
							value={form.contrasenha}
							onChange={onChange}
							required
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
					</div>
					{erroInicioSesion ? <p className='text-sm text-red-500'>{t.loginErrorInvalid}</p> : null}
					<button
						type='submit'
						disabled={validando}
						className='w-full px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm disabled:opacity-60'>
						{t.loginButton}
					</button>
				</form>
				<div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400'>
					<div className='flex items-center gap-3'>
						<button
							type='button'
							onClick={() => {
								setModoAxuda((prev) => (prev === 'crear' ? '' : 'crear'));
								setErroSecundario('');
							}}
							className='hover:text-indigo-500 transition-colors'>
							{t.loginCreateAccount}
						</button>
						<span>-</span>
						<button
							type='button'
							onClick={() => {
								setModoAxuda((prev) => (prev === 'contrasinal' ? '' : 'contrasinal'));
								setErroSecundario('');
							}}
							className='hover:text-indigo-500 transition-colors'>
							{t.loginChangePassword}
						</button>
					</div>
				</div>
				{modoAxuda === 'crear' ? (
					<form onSubmit={onSubmitCrearConta} className='mt-4 space-y-3'>
						<input
							type='text'
							value={formCrearConta.id}
							onChange={(e) =>
								setFormCrearConta((prev) => ({
									...prev,
									id: e.target.value,
								}))
							}
							placeholder={t.loginUserId}
							required
							className='w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							type='text'
							value={formCrearConta.nome}
							onChange={(e) =>
								setFormCrearConta((prev) => ({
									...prev,
									nome: e.target.value,
								}))
							}
							placeholder={t.userName}
							required
							className='w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							type='password'
							value={formCrearConta.contrasenha}
							onChange={(e) =>
								setFormCrearConta((prev) => ({
									...prev,
									contrasenha: e.target.value,
								}))
							}
							placeholder={t.loginPassword}
							required
							className='w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<button
							type='submit'
							className='w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'>
							{t.loginCreateAccount}
						</button>
					</form>
				) : null}
				{modoAxuda === 'contrasinal' ? (
					<form onSubmit={onSubmitCambiarContrasinal} className='mt-4 space-y-3'>
						<input
							type='text'
							value={formCambiarContrasinal.id}
							onChange={(e) =>
								setFormCambiarContrasinal((prev) => ({
									...prev,
									id: e.target.value,
								}))
							}
							placeholder={t.loginUserId}
							required
							className='w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							type='password'
							value={formCambiarContrasinal.contrasenhaActual}
							onChange={(e) =>
								setFormCambiarContrasinal((prev) => ({
									...prev,
									contrasenhaActual: e.target.value,
								}))
							}
							placeholder={t.passwordCurrent}
							required
							className='w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<input
							type='password'
							value={formCambiarContrasinal.contrasenhaNova}
							onChange={(e) =>
								setFormCambiarContrasinal((prev) => ({
									...prev,
									contrasenhaNova: e.target.value,
								}))
							}
							placeholder={t.passwordNew}
							required
							className='w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
						/>
						<button
							type='submit'
							className='w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'>
							{t.loginChangePassword}
						</button>
					</form>
				) : null}
				{erroSecundario ? <p className='mt-3 text-sm text-red-500'>{erroSecundario}</p> : null}
			</div>
		</div>
	);
}
