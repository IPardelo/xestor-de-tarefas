import { useState } from 'react';
import PropTypes from 'prop-types';
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

const clasesInput =
	'w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white';
const clasesLabel = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const clasesBoton =
	'w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium disabled:opacity-60 disabled:cursor-not-allowed';

function Campo({ id, label, ...props }) {
	return (
		<div>
			<label htmlFor={id} className={clasesLabel}>
				{label}
			</label>
			<input id={id} className={clasesInput} required {...props} />
		</div>
	);
}

Campo.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
};

export default function LoginView({ onLogin }) {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const t = translations[idioma] || translations.gl;

	const [modo, setModo] = useState('login');
	const [form, setForm] = useState({ email: '', id: '', nome: '', contrasenha: '' });
	const [mensaxe, setMensaxe] = useState('');
	const [erro, setErro] = useState('');
	const [loading, setLoading] = useState(false);

	const onChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const cambiarModo = (novoModo) => {
		setModo(novoModo);
		setErro('');
		setMensaxe('');
	};

	const executar = async (accion) => {
		setLoading(true);
		setErro('');
		setMensaxe('');
		try {
			await accion();
		} catch (error) {
			setErro(mensaxeErroAuth(error, t));
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = (event) => {
		event.preventDefault();
		executar(async () => {
			if (usaFirebaseAuth) await dispatch(entrarConEmail(form.email, form.contrasenha));
			else dispatch(entrarEnLocal(form.id.trim(), form.contrasenha));
			onLogin?.();
		});
	};

	const onRexistro = (event) => {
		event.preventDefault();
		executar(async () => {
			await dispatch(crearConta({ email: form.email, id: form.id, nome: form.nome, contrasinal: form.contrasenha }));
			onLogin?.();
		});
	};

	const onEsquecin = (event) => {
		event.preventDefault();
		executar(async () => {
			await enviarCorreoRestablecemento(form.email);
			setMensaxe(t.loginForgotPasswordSent);
		});
	};

	const campoEmail = (
		<Campo
			id='login-email'
			label={t.loginEmail}
			type='email'
			name='email'
			value={form.email}
			onChange={onChange}
			autoComplete='email'
		/>
	);
	const campoContrasinal = (autoComplete) => (
		<Campo
			id='login-contrasenha'
			label={t.loginPassword}
			type='password'
			name='contrasenha'
			value={form.contrasenha}
			onChange={onChange}
			autoComplete={autoComplete}
		/>
	);
	const campoId = (
		<Campo id='login-id' label={t.loginUserId} type='text' name='id' value={form.id} onChange={onChange} autoComplete='username' />
	);

	const titulos = {
		login: t.loginTitle,
		rexistro: t.loginCreateAccount,
		esquecin: t.loginForgotPassword,
	};

	const ligazon = (destino, texto) => (
		<button
			type='button'
			onClick={() => cambiarModo(destino)}
			className={`transition-colors ${
				modo === destino ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-indigo-500'
			}`}>
			{texto}
		</button>
	);

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center px-4'>
			<div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8'>
				<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-5'>{titulos[modo]}</h1>

				{modo === 'login' && (
					<form className='space-y-4' onSubmit={onSubmit}>
						{usaFirebaseAuth ? campoEmail : campoId}
						{campoContrasinal('current-password')}
						{erro && <p className='text-sm text-red-600 dark:text-red-400'>{erro}</p>}
						{mensaxe && <p className='text-sm text-emerald-600 dark:text-emerald-400'>{mensaxe}</p>}
						<button type='submit' disabled={loading} className={clasesBoton}>
							{loading ? t.loginValidating : t.loginButton}
						</button>
					</form>
				)}

				{modo === 'rexistro' && (
					<form className='space-y-4' onSubmit={onRexistro}>
						{usaFirebaseAuth ? campoEmail : campoId}
						<Campo id='login-nome' label={t.userName} type='text' name='nome' value={form.nome} onChange={onChange} />
						{campoContrasinal('new-password')}
						{erro && <p className='text-sm text-red-600 dark:text-red-400'>{erro}</p>}
						<button type='submit' disabled={loading} className={clasesBoton}>
							{t.loginCreateAccount}
						</button>
					</form>
				)}

				{modo === 'esquecin' && (
					<form className='space-y-4' onSubmit={onEsquecin}>
						{campoEmail}
						{erro && <p className='text-sm text-red-600 dark:text-red-400'>{erro}</p>}
						{mensaxe && <p className='text-sm text-emerald-600 dark:text-emerald-400'>{mensaxe}</p>}
						<button type='submit' disabled={loading} className={clasesBoton}>
							{t.loginForgotPasswordButton}
						</button>
					</form>
				)}

				<div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-2'>
					{modo !== 'login' && (
						<>
							{ligazon('login', t.loginBackToLogin)}
							<span>-</span>
						</>
					)}
					{ligazon('rexistro', t.loginCreateAccount)}
					{usaFirebaseAuth && (
						<>
							<span>-</span>
							{ligazon('esquecin', t.loginForgotPassword)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

LoginView.propTypes = {
	onLogin: PropTypes.func,
};
