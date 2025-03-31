import { deleteApp, initializeApp } from 'firebase/app';
import {
	EmailAuthProvider,
	createUserWithEmailAndPassword,
	deleteUser,
	inMemoryPersistence,
	initializeAuth,
	onAuthStateChanged,
	reauthenticateWithCredential,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	updatePassword,
} from 'firebase/auth';
import { auth, firebaseConfig, hasFirebaseConfig } from '@/App/firebase';
import { cargarUsuariosRemotos } from '@/App/persistence';
import { detenerSincronizacion, iniciarSincronizacion } from '@/App/sincronizacion';
import {
	hidratarUsuarios,
	iniciarSesion,
	pecharSesion,
	rexistrarUsuarioDesdeLogin,
	vincularContaFirebase,
} from '@/Features/Users/usuariosSlice';

/*
 * Autenticación con Firebase Authentication (email + contrasinal).
 *
 * - A conta de Firebase Auth identifica á persoa (uid). O "usuario da app"
 *   (nome, admin, preferencias...) segue en tarefas-shared/default/usuarios/{id}
 *   e lévase o uid e o email da súa conta.
 * - Os contrasinais xa non se gardan en Firestore nin en localStorage.
 * - Unha conta de Firebase sen usuario na app (p. ex. creada na consola) recibe
 *   un usuario normal (non admin) ao entrar por primeira vez.
 * - Sen configuración de Firebase (.env baleiro) a app segue funcionando só en
 *   local, co login por ID e contrasinal de sempre.
 */

export const usaFirebaseAuth = hasFirebaseConfig;

const normalizarEmail = (email) => String(email || '').trim().toLowerCase();

export class ErroAutenticacion extends Error {
	constructor(codigo) {
		super(codigo);
		this.code = codigo;
	}
}

// ---------- Modo local (sen Firebase) ----------

/** Valida ID e contrasinal contra os usuarios gardados no dispositivo. */
export function validarCredenciaisLocais(loginId, contrasinal, usuarios = []) {
	return (
		usuarios.find(
			(usuario) =>
				usuario?.id === loginId && !!usuario?.contrasenha && String(usuario.contrasenha) === contrasinal
		) || null
	);
}

// ---------- Utilidades ----------

const buscarUsuarioDaConta = (usuarios, contaFirebase) => {
	const email = normalizarEmail(contaFirebase?.email);
	return (
		usuarios.find((u) => u?.uid && u.uid === contaFirebase.uid) ||
		usuarios.find((u) => !u?.uid && email && normalizarEmail(u?.email) === email) ||
		null
	);
};

// Engade ao estado os usuarios remotos que aínda non estean en local (dispositivo novo).
const engadirUsuariosRemotos = (dispatch, getState, remotos) => {
	const locais = getState().usuarios.lista;
	const idsLocais = new Set(locais.map((u) => u.id));
	const novos = remotos.filter((u) => u?.id && !idsLocais.has(u.id));
	if (novos.length === 0) return;
	dispatch({ ...hidratarUsuarios({ lista: [...locais, ...novos] }), meta: { orixeRemota: true } });
};

const idDesdeEmail = (email, usuarios) => {
	const base =
		normalizarEmail(email)
			.split('@')[0]
			.replace(/[^a-z0-9._-]/g, '') || 'usuario';
	const ids = new Set(usuarios.map((u) => u.id));
	let id = base;
	for (let n = 2; ids.has(id); n += 1) id = `${base}${n}`;
	return id;
};

// ---------- Accións (thunks) ----------

/** Login con email e contrasinal. */
export const entrarConEmail = (email, contrasinal) => async (dispatch, getState) => {
	const { user } = await signInWithEmailAndPassword(auth, normalizarEmail(email), contrasinal);
	try {
		const remotos = await cargarUsuariosRemotos();
		engadirUsuariosRemotos(dispatch, getState, remotos);
		const usuario = buscarUsuarioDaConta(remotos, user) || buscarUsuarioDaConta(getState().usuarios.lista, user);
		if (usuario) {
			if (!usuario.uid) dispatch(vincularContaFirebase({ id: usuario.id, email: user.email, uid: user.uid }));
			dispatch(iniciarSesion(usuario.id));
			return usuario;
		}
		// Conta de Firebase sen usuario na app (p. ex. creada na consola de Firebase):
		// créase un usuario normal (non admin) que un admin pode editar despois.
		const id = idDesdeEmail(user.email, getState().usuarios.lista);
		dispatch(
			rexistrarUsuarioDesdeLogin({
				id,
				nome: user.displayName || user.email.split('@')[0],
				email: user.email,
				uid: user.uid,
			})
		);
		dispatch(iniciarSesion(id));
		return getState().usuarios.lista.find((u) => u.id === id) || null;
	} catch (error) {
		await signOut(auth);
		throw error;
	}
};

/** Login en modo local (sen Firebase): ID e contrasinal. */
export const entrarEnLocal = (loginId, contrasinal) => (dispatch, getState) => {
	const usuario = validarCredenciaisLocais(loginId, contrasinal, getState().usuarios.lista);
	if (!usuario) throw new ErroAutenticacion('auth/invalid-credential');
	dispatch(iniciarSesion(usuario.id));
	return usuario;
};

/**
 * Crea unha conta nova dende a pantalla de login e entra con ela.
 * Con Firebase créase en Firebase Auth (email); sen Firebase, só en local (ID).
 */
export const crearConta = ({ email, id: idLocal, nome, contrasinal }) => async (dispatch, getState) => {
	if (!usaFirebaseAuth) {
		const id = String(idLocal || '').trim();
		if (!id || !contrasinal) throw new ErroAutenticacion('auth/invalid-credential');
		if (getState().usuarios.lista.some((u) => u.id === id)) throw new ErroAutenticacion('app/id-existe');
		dispatch(rexistrarUsuarioDesdeLogin({ id, nome: String(nome || '').trim(), contrasenha: contrasinal }));
		dispatch(iniciarSesion(id));
		return id;
	}
	const { user } = await createUserWithEmailAndPassword(auth, normalizarEmail(email), contrasinal);
	try {
		const remotos = await cargarUsuariosRemotos();
		engadirUsuariosRemotos(dispatch, getState, remotos);
		const id = idDesdeEmail(user.email, getState().usuarios.lista);
		dispatch(rexistrarUsuarioDesdeLogin({ id, nome: String(nome || '').trim(), email: user.email, uid: user.uid }));
		dispatch(iniciarSesion(id));
		return id;
	} catch (error) {
		await deleteUser(user).catch(() => {});
		await signOut(auth).catch(() => {});
		throw error;
	}
};

/** Pecha a sesión (na app e en Firebase). */
export const sairDaSesion = () => async (dispatch) => {
	dispatch(pecharSesion());
	if (usaFirebaseAuth) await signOut(auth).catch(() => {});
};

// ---------- Contrasinais ----------

/** Cambia o contrasinal da conta con sesión iniciada (pide o actual). */
export async function cambiarContrasinal(contrasinalActual, novoContrasinal) {
	const conta = auth?.currentUser;
	if (!conta?.email) throw new ErroAutenticacion('auth/no-current-user');
	await reauthenticateWithCredential(conta, EmailAuthProvider.credential(conta.email, contrasinalActual));
	await updatePassword(conta, novoContrasinal);
}

/** Envía o correo de Firebase para restablecer o contrasinal. */
export async function enviarCorreoRestablecemento(email) {
	try {
		await sendPasswordResetEmail(auth, normalizarEmail(email));
	} catch (error) {
		// Non se revela se o email ten conta ou non.
		if (error?.code !== 'auth/user-not-found') throw error;
	}
}

/**
 * Un admin crea a conta doutra persoa sen pechar a súa propia sesión:
 * faise nunha instancia secundaria de Firebase que se descarta ao rematar.
 * Devolve { uid, email }.
 */
export async function crearContaParaOutraPersoa(email, contrasinal) {
	const appSecundaria = initializeApp(firebaseConfig, `alta-usuario-${Date.now()}`);
	try {
		const authSecundaria = initializeAuth(appSecundaria, { persistence: inMemoryPersistence });
		const { user } = await createUserWithEmailAndPassword(authSecundaria, normalizarEmail(email), contrasinal);
		await signOut(authSecundaria);
		return { uid: user.uid, email: user.email };
	} finally {
		await deleteApp(appSecundaria).catch(() => {});
	}
}

// ---------- Arranque ----------

/**
 * Escoita a sesión de Firebase: coa sesión iniciada sincronízase con Firestore;
 * sen ela, párase a sincronización e péchase a sesión da app.
 */
export function iniciarAutenticacion(store) {
	if (!usaFirebaseAuth) {
		iniciarSincronizacion(store);
		return;
	}
	onAuthStateChanged(auth, (conta) => {
		if (conta) {
			iniciarSincronizacion(store);
			return;
		}
		detenerSincronizacion();
		if (store.getState().usuarios.sesionIniciada) store.dispatch(pecharSesion());
	});
}

// ---------- Mensaxes de erro ----------

export function mensaxeErroAuth(error, t) {
	switch (error?.code) {
		case 'auth/invalid-credential':
		case 'auth/wrong-password':
		case 'auth/user-not-found':
		case 'auth/invalid-login-credentials':
			return usaFirebaseAuth ? t.loginErrorInvalidEmail : t.loginErrorInvalid;
		case 'auth/email-already-in-use':
			return t.authErrorEmailInUse;
		case 'app/id-existe':
			return t.loginCreateAccountExists;
		case 'auth/weak-password':
			return t.authErrorWeakPassword;
		case 'auth/invalid-email':
		case 'auth/missing-email':
			return t.authErrorInvalidEmail;
		case 'auth/too-many-requests':
			return t.authErrorTooManyRequests;
		case 'auth/network-request-failed':
			return t.authErrorNetwork;
		case 'auth/requires-recent-login':
			return t.passwordCurrentInvalid;
		default:
			return t.authErrorGeneric;
	}
}
