import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
	cambiarContrasinalDesdeLogin,
	cambiarUsuario,
	rexistrarUsuarioDesdeLogin,
	seleccionarUsuarios,
} from '@/Features/Users/usuariosSlice';
import { cargarDatosApp, isCloudSyncEnabled } from '@/App/persistence';

const getUsuariosFromRemoteData = (data) => {
	if (!data?.usuarios) return [];
	if (Array.isArray(data.usuarios)) return data.usuarios;
	if (Array.isArray(data.usuarios.lista)) return data.usuarios.lista;
	return [];
};

export default function LoginView({ onLogin }) {
	const dispatch = useDispatch();
	const usuariosLocais = useSelector(seleccionarUsuarios);
	const [id, setId] = useState('');
	const [contrasenha, setContrasenha] = useState('');
	const [modo, setModo] = useState('login');
	const [novoId, setNovoId] = useState('');
	const [novoNome, setNovoNome] = useState('');
	const [novaContrasenha, setNovaContrasenha] = useState('');
	const [cambioId, setCambioId] = useState('');
	const [cambioContrasenhaActual, setCambioContrasenhaActual] = useState('');
	const [cambioNovaContrasenha, setCambioNovaContrasenha] = useState('');
	const [mensaxe, setMensaxe] = useState('');
	const [erro, setErro] = useState('');
	const [loading, setLoading] = useState(false);

	const cambiarModo = (novoModo) => {
		setModo(novoModo);
		setErro('');
		setMensaxe('');
	};

	const validarCredenciais = (usuarios, loginId, loginContrasenha) =>
		usuarios.find(
			(usuario) => usuario?.id === loginId && String(usuario?.contrasenha || '') === loginContrasenha
		);

	const onSubmit = async (event) => {
		event.preventDefault();
		const loginId = id.trim();
		if (!loginId || !contrasenha) {
			setErro('Debes indicar ID e contrasinal.');
			return;
		}

		setLoading(true);
		setErro('');

		try {
			let usuarioValido = null;

			if (isCloudSyncEnabled()) {
				const remoteData = await cargarDatosApp();
				const usuariosRemotos = getUsuariosFromRemoteData(remoteData);
				usuarioValido = validarCredenciais(usuariosRemotos, loginId, contrasenha);
			}

			if (!usuarioValido) {
				usuarioValido = validarCredenciais(usuariosLocais, loginId, contrasenha);
			}

			if (!usuarioValido) {
				setErro('Credenciais incorrectas.');
				return;
			}

			dispatch(cambiarUsuario(usuarioValido.id));
			onLogin();
		} catch {
			setErro('Non foi posible validar o login con Firebase.');
		} finally {
			setLoading(false);
		}
	};

	const onRexistro = (event) => {
		event.preventDefault();
		const idLimpo = novoId.trim();
		const nomeLimpo = novoNome.trim();
		if (!idLimpo || !nomeLimpo || !novaContrasenha) {
			setErro('Debes indicar ID, nome e contrasinal.');
			setMensaxe('');
			return;
		}
		if (usuariosLocais.some((u) => u.id === idLimpo)) {
			setErro('Xa existe un usuario con ese ID.');
			setMensaxe('');
			return;
		}
		dispatch(
			rexistrarUsuarioDesdeLogin({
				id: idLimpo,
				nome: nomeLimpo,
				contrasenha: novaContrasenha,
			})
		);
		setNovoId('');
		setNovoNome('');
		setNovaContrasenha('');
		setErro('');
		setMensaxe('Usuario creado correctamente. Xa podes iniciar sesión.');
		setModo('login');
	};

	const onCambiarContrasinal = (event) => {
		event.preventDefault();
		const idLimpo = cambioId.trim();
		if (!idLimpo || !cambioContrasenhaActual || !cambioNovaContrasenha) {
			setErro('Debes indicar ID, contrasinal actual e novo contrasinal.');
			setMensaxe('');
			return;
		}
		const usuario = usuariosLocais.find((u) => u.id === idLimpo);
		if (!usuario || String(usuario?.contrasenha || '') !== cambioContrasenhaActual) {
			setErro('ID ou contrasinal actual incorrectos.');
			setMensaxe('');
			return;
		}
		dispatch(
			cambiarContrasinalDesdeLogin({
				id: idLimpo,
				contrasenhaActual: cambioContrasenhaActual,
				novaContrasenha: cambioNovaContrasenha,
			})
		);
		setCambioId('');
		setCambioContrasenhaActual('');
		setCambioNovaContrasenha('');
		setErro('');
		setMensaxe('Contrasinal actualizado correctamente.');
		setModo('login');
	};

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center px-4'>
			<div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8'>
				<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-5'>Iniciar sesión</h1>
				{modo === 'login' && (
					<form className='space-y-4' onSubmit={onSubmit}>
						<div>
							<label htmlFor='login-id' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								ID de usuario
							</label>
							<input
								id='login-id'
								type='text'
								value={id}
								onChange={(event) => setId(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								autoComplete='username'
								required
							/>
						</div>

						<div>
							<label
								htmlFor='login-contrasenha'
								className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								Contrasinal
							</label>
							<input
								id='login-contrasenha'
								type='password'
								value={contrasenha}
								onChange={(event) => setContrasenha(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								autoComplete='current-password'
								required
							/>
						</div>

						{erro && <p className='text-sm text-red-600 dark:text-red-400'>{erro}</p>}
						{mensaxe && <p className='text-sm text-emerald-600 dark:text-emerald-400'>{mensaxe}</p>}

						<button
							type='submit'
							disabled={loading}
							className='w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium disabled:opacity-60 disabled:cursor-not-allowed'>
							{loading ? 'Validando...' : 'Entrar'}
						</button>
					</form>
				)}
				{modo === 'rexistro' && (
					<form className='space-y-4' onSubmit={onRexistro}>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>ID de usuario</label>
							<input
								type='text'
								value={novoId}
								onChange={(event) => setNovoId(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								required
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Nome completo</label>
							<input
								type='text'
								value={novoNome}
								onChange={(event) => setNovoNome(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								required
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Contrasinal</label>
							<input
								type='password'
								value={novaContrasenha}
								onChange={(event) => setNovaContrasenha(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								autoComplete='new-password'
								required
							/>
						</div>
						{erro && <p className='text-sm text-red-600 dark:text-red-400'>{erro}</p>}
						{mensaxe && <p className='text-sm text-emerald-600 dark:text-emerald-400'>{mensaxe}</p>}
						<button
							type='submit'
							className='w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium'>
							Crear conta
						</button>
					</form>
				)}
				{modo === 'cambiar' && (
					<form className='space-y-4' onSubmit={onCambiarContrasinal}>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>ID de usuario</label>
							<input
								type='text'
								value={cambioId}
								onChange={(event) => setCambioId(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								required
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Contrasinal actual</label>
							<input
								type='password'
								value={cambioContrasenhaActual}
								onChange={(event) => setCambioContrasenhaActual(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								autoComplete='current-password'
								required
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Novo contrasinal</label>
							<input
								type='password'
								value={cambioNovaContrasenha}
								onChange={(event) => setCambioNovaContrasenha(event.target.value)}
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								autoComplete='new-password'
								required
							/>
						</div>
						{erro && <p className='text-sm text-red-600 dark:text-red-400'>{erro}</p>}
						{mensaxe && <p className='text-sm text-emerald-600 dark:text-emerald-400'>{mensaxe}</p>}
						<button
							type='submit'
							className='w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium'>
							Actualizar contrasinal
						</button>
					</form>
				)}
				<div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4'>
					<button
						type='button'
						onClick={() => cambiarModo('rexistro')}
						className={`transition-colors ${
							modo === 'rexistro' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-indigo-500'
						}`}>
						Crear conta
					</button>
					<span>-</span>
					<button
						type='button'
						onClick={() => cambiarModo('cambiar')}
						className={`transition-colors ${
							modo === 'cambiar' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-indigo-500'
						}`}>
						Cambiar contrasinal
					</button>
					{modo !== 'login' && (
						<>
							<span>-</span>
							<button
								type='button'
								onClick={() => cambiarModo('login')}
								className='transition-colors hover:text-indigo-500'>
								Volver a iniciar sesión
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

LoginView.propTypes = {
	onLogin: PropTypes.func.isRequired,
};
