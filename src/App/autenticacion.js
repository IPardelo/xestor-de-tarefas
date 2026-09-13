import { cargarUsuariosRemotos, isCloudSyncEnabled } from '@/App/persistence';

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
		usuarioValido = buscarUsuario(await cargarUsuariosRemotos(), loginId, loginContrasenha);
	}

	return usuarioValido || buscarUsuario(usuariosLocais, loginId, loginContrasenha) || null;
}
