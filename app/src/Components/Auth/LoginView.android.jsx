import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	crearConta,
	entrarConEmail,
	entrarEnLocal,
	enviarCorreoRestablecemento,
	mensaxeErroAuth,
	usaFirebaseAuth,
} from '@/App/autenticacion';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';
import { showToast } from '@/Utils/toast';

const clasesInput =
	'w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white';
const clasesInputPequeno =
	'w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white';
const clasesBotonSecundario =
	'w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60';

export default function LoginView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const t = translations[idioma] || translations.gl;
	const [validando, setValidando] = useState(false);
	const [erroInicioSesion, setErroInicioSesion] = useState('');
	const [form, setForm] = useState({ usuario: '', contrasenha: '' });
	const [modoAxuda, setModoAxuda] = useState('');
	const [erroSecundario, setErroSecundario] = useState('');
	const [formAxuda, setFormAxuda] = useState({ email: '', id: '', nome: '', contrasenha: '' });

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const onChangeAxuda = (e) => {
		const { name, value } = e.target;
		setFormAxuda((prev) => ({ ...prev, [name]: value }));
	};

	const alternarAxuda = (modo) => {
		setModoAxuda((prev) => (prev === modo ? '' : modo));
		setErroSecundario('');
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		setValidando(true);
		setErroInicioSesion('');
		try {
			if (usaFirebaseAuth) await dispatch(entrarConEmail(form.usuario, form.contrasenha));
			else dispatch(entrarEnLocal(form.usuario.trim(), form.contrasenha));
		} catch (error) {
			setErroInicioSesion(mensaxeErroAuth(error, t));
		} finally {
			setValidando(false);
		}
	};

	const executarAxuda = async (accion) => {
		setValidando(true);
		setErroSecundario('');
		try {
			await accion();
		} catch (error) {
			setErroSecundario(mensaxeErroAuth(error, t));
		} finally {
			setValidando(false);
		}
	};

	const onSubmitCrearConta = (e) => {
		e.preventDefault();
		executarAxuda(async () => {
			await dispatch(
				crearConta({
					email: formAxuda.email,
					id: formAxuda.id,
					nome: formAxuda.nome,
					contrasinal: formAxuda.contrasenha,
				})
			);
			showToast(t.loginCreateAccountSuccess);
		});
	};

	const onSubmitEsquecin = (e) => {
		e.preventDefault();
		executarAxuda(async () => {
			await enviarCorreoRestablecemento(formAxuda.email);
			showToast(t.loginForgotPasswordSent);
			setModoAxuda('');
		});
	};

	const inputAxuda = (name, type, placeholder, autoComplete) => (
		<input
			type={type}
			name={name}
			value={formAxuda[name]}
			onChange={onChangeAxuda}
			placeholder={placeholder}
			autoComplete={autoComplete}
			required
			className={clasesInputPequeno}
		/>
	);

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4'>
			<div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8'>
				<h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-6'>{t.loginTitle}</h1>
				<form onSubmit={onSubmit} className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							{usaFirebaseAuth ? t.loginEmail : t.loginUserId}
						</label>
						<input
							type={usaFirebaseAuth ? 'email' : 'text'}
							name='usuario'
							value={form.usuario}
							onChange={onChange}
							autoComplete={usaFirebaseAuth ? 'email' : 'username'}
							required
							className={clasesInput}
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
							autoComplete='current-password'
							required
							className={clasesInput}
						/>
					</div>
					{erroInicioSesion ? <p className='text-sm text-red-500'>{erroInicioSesion}</p> : null}
					<button
						type='submit'
						disabled={validando}
						className='w-full px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm disabled:opacity-60'>
						{validando ? t.loginValidating : t.loginButton}
					</button>
				</form>
				<div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400'>
					<div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
						<button type='button' onClick={() => alternarAxuda('crear')} className='hover:text-indigo-500 transition-colors'>
							{t.loginCreateAccount}
						</button>
						{usaFirebaseAuth ? (
							<>
								<span>-</span>
								<button type='button' onClick={() => alternarAxuda('esquecin')} className='hover:text-indigo-500 transition-colors'>
									{t.loginForgotPassword}
								</button>
							</>
						) : null}
					</div>
				</div>
				{modoAxuda === 'crear' ? (
					<form onSubmit={onSubmitCrearConta} className='mt-4 space-y-3'>
						{usaFirebaseAuth
							? inputAxuda('email', 'email', t.loginEmail, 'email')
							: inputAxuda('id', 'text', t.loginUserId, 'username')}
						{inputAxuda('nome', 'text', t.userName, 'name')}
						{inputAxuda('contrasenha', 'password', t.loginPassword, 'new-password')}
						<button type='submit' disabled={validando} className={clasesBotonSecundario}>
							{t.loginCreateAccount}
						</button>
					</form>
				) : null}
				{modoAxuda === 'esquecin' ? (
					<form onSubmit={onSubmitEsquecin} className='mt-4 space-y-3'>
						{inputAxuda('email', 'email', t.loginEmail, 'email')}
						<button type='submit' disabled={validando} className={clasesBotonSecundario}>
							{t.loginForgotPasswordButton}
						</button>
					</form>
				) : null}
				{erroSecundario ? <p className='mt-3 text-sm text-red-500'>{erroSecundario}</p> : null}
			</div>
		</div>
	);
}
