import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { cambiarUsuario, seleccionarUsuarios } from '@/Features/Users/usuariosSlice';
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
	const [erro, setErro] = useState('');
	const [loading, setLoading] = useState(false);

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

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center px-4'>
			<div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8'>
				<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-5'>Iniciar sesion</h1>
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

					<button
						type='submit'
						disabled={loading}
						className='w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium disabled:opacity-60 disabled:cursor-not-allowed'>
						{loading ? 'Validando...' : 'Entrar'}
					</button>
				</form>
			</div>
		</div>
	);
}

LoginView.propTypes = {
	onLogin: PropTypes.func.isRequired,
};
