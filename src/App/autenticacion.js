import { cargarDatosApp, isCloudSyncEnabled } from '@/App/persistence';

const getUsuariosFromRemoteData = (data) => {
	if (!data?.usuarios) return [];
	if (Array.isArray(data.usuarios)) return data.usuarios;
	if (Array.isArray(data.usuarios.lista)) return data.usuarios.lista;
	return [];
};

const buscarUsuario = (usuarios, loginId, loginContrasenha) =>
	usuarios.find(
		(usuario) => usuario?.id === loginId && String(usuario?.contrasenha || '') === loginContrasenha
	);

/**
 * Valida ID e contrasinal: primeiro contra os usuarios de Firebase e, se non
 * coincide, contra os usuarios locais. Devolve o usuario ou null.
 * Lanza un erro se Firebase está configurado pero non responde.
 */
export async function validarCredenciais(loginId, loginContrasenha, usuariosLocais = []) {
	let usuarioValido = null;

	if (isCloudSyncEnabled()) {
		const remoteData = await cargarDatosApp();
		usuarioValido = buscarUsuario(getUsuariosFromRemoteData(remoteData), loginId, loginContrasenha);
	}

	return usuarioValido || buscarUsuario(usuariosLocais, loginId, loginContrasenha) || null;
}
