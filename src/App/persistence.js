import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db, firebaseSyncDoc, hasFirebaseConfig } from '@/App/firebase';

/*
 * Estrutura en Firestore (a partir da v2.3.0)
 *
 *   tarefas-shared/default                 ← documento antigo (v1): xa non se escribe
 *   tarefas-shared/default/usuarios/{id}   ← un documento por usuario
 *   tarefas-shared/default/tarefas/{id}    ← un documento por tarefa
 *   tarefas-shared/default/proxectos/{id}  ← un documento por proxecto
 *   tarefas-shared/default/notas/{id}      ← un documento por nota
 *   tarefas-shared/default/meta/esquema    ← versión da estrutura (migración feita)
 *   tarefas-shared/default/meta/copia-v1   ← copia do documento antigo ao migrar
 *   tarefas-shared/default/meta/kdbx       ← configuración KDBX gardada dende Opcións
 *
 * Cada cambio só escribe o elemento que cambiou, así que un dispositivo con datos
 * vellos xa non pode pisar o documento enteiro.
 */

export const COLECCIONS_SINCRONIZADAS = ['usuarios', 'tarefas', 'proxectos', 'notas'];
export const VERSION_ESQUEMA = 2;

// Tamaño máximo dun lote de escrituras en Firestore é 500; deixamos marxe.
const TAMANO_LOTE = 450;

const partesRuta = () => {
	const [nomeColeccion, docId] = String(firebaseSyncDoc || '').split('/');
	if (!nomeColeccion || !docId) throw new Error('Ruta de documento Firebase inválida');
	return [nomeColeccion, docId];
};

const requireDb = () => {
	if (!hasFirebaseConfig || !db) throw new Error('Firebase non está configurado');
	return db;
};

export const isCloudSyncEnabled = () => hasFirebaseConfig;

// Os IDs poden ter caracteres que Firestore non admite nun ID de documento (p. ex. "/").
export const idDocumento = (id) => encodeURIComponent(String(id));

const refDocumentoBase = () => doc(requireDb(), ...partesRuta());
export const refColeccion = (nome) => collection(requireDb(), ...partesRuta(), nome);
const refElemento = (nome, id) => doc(requireDb(), ...partesRuta(), nome, idDocumento(id));
const refMeta = (nome) => doc(requireDb(), ...partesRuta(), 'meta', nome);

// Firestore non acepta undefined nin funcións: gárdase só o que sobrevive a JSON.
const limparParaFirestore = (valor) => JSON.parse(JSON.stringify(valor));

/** Extrae os elementos de cada colección do documento antigo (v1). */
export const extraerDoDocumentoAntigo = (data, nome) => {
	const orixe = {
		usuarios: data?.usuarios,
		tarefas: data?.tareas,
		proxectos: data?.proxectos,
		notas: data?.notas,
	}[nome];
	let lista = [];
	if (Array.isArray(orixe)) lista = orixe;
	else if (nome === 'usuarios' && Array.isArray(orixe?.lista)) lista = orixe.lista;
	else if (nome === 'tarefas' && Array.isArray(orixe?.tareas)) lista = orixe.tareas;
	else if (nome === 'proxectos' && Array.isArray(orixe?.lista)) lista = orixe.lista;
	else if (nome === 'notas' && Array.isArray(orixe?.notas)) lista = orixe.notas;
	return lista.filter((item) => item && typeof item === 'object' && (typeof item.id === 'string' || typeof item.id === 'number'));
};

const executarEnLotes = async (operacions) => {
	for (let i = 0; i < operacions.length; i += TAMANO_LOTE) {
		const lote = writeBatch(requireDb());
		operacions.slice(i, i + TAMANO_LOTE).forEach((operacion) => operacion(lote));
		await lote.commit();
	}
};

/**
 * Pasa os datos do documento antigo a unha colección por tipo, só unha vez.
 * - Garda antes unha copia do documento antigo en meta/copia-v1.
 * - Non pisa elementos que xa existan nas coleccións novas.
 * Lanza un erro se non hai conexión: quen a chama debe reintentar.
 */
export async function migrarSeFaiFalta() {
	const esquema = await getDoc(refMeta('esquema'));
	if (esquema.exists() && Number(esquema.data()?.version) >= VERSION_ESQUEMA) {
		return { migrado: false };
	}

	const antigo = await getDoc(refDocumentoBase());
	let elementosMigrados = 0;

	if (antigo.exists()) {
		const data = antigo.data();

		const copia = await getDoc(refMeta('copia-v1'));
		if (!copia.exists()) {
			await setDoc(refMeta('copia-v1'), {
				gardadoEn: new Date().toISOString(),
				datos: limparParaFirestore(data),
			});
		}

		const operacions = [];
		for (const nome of COLECCIONS_SINCRONIZADAS) {
			const existentes = await getDocs(refColeccion(nome));
			const idsExistentes = new Set(existentes.docs.map((d) => d.id));
			extraerDoDocumentoAntigo(data, nome).forEach((item) => {
				if (idsExistentes.has(idDocumento(item.id))) return;
				operacions.push((lote) => lote.set(refElemento(nome, item.id), limparParaFirestore(item)));
				elementosMigrados += 1;
			});
		}
		await executarEnLotes(operacions);
	}

	await setDoc(refMeta('esquema'), {
		version: VERSION_ESQUEMA,
		migradoEn: new Date().toISOString(),
		elementosMigrados,
	});
	return { migrado: true, elementosMigrados };
}

/**
 * Escribe cambios elemento a elemento.
 * @param {Array<{nome: string, id: string, item: object|null}>} cambios item null = borrar
 */
export async function enviarCambios(cambios) {
	await executarEnLotes(
		cambios.map(({ nome, id, item }) => (lote) => {
			if (item) lote.set(refElemento(nome, id), limparParaFirestore(item));
			else lote.delete(refElemento(nome, id));
		})
	);
}

/** Escoita unha colección. onData recibe (elementos, snapshot). */
export function subscribirseAColeccion(nome, onData, onError) {
	return onSnapshot(
		refColeccion(nome),
		(snapshot) => onData(snapshot.docs.map((d) => d.data()), snapshot),
		(error) => onError?.(error)
	);
}

/** Usuarios gardados en Firebase (para validar o login). */
export async function cargarUsuariosRemotos() {
	const snapshot = await getDocs(refColeccion('usuarios'));
	if (!snapshot.empty) return snapshot.docs.map((d) => d.data());

	// Aínda sen migrar: lense do documento antigo.
	const antigo = await getDoc(refDocumentoBase());
	return antigo.exists() ? extraerDoDocumentoAntigo(antigo.data(), 'usuarios') : [];
}

/** Garda a configuración KDBX en meta/kdbx (antes ía dentro do documento enteiro). */
export async function gardarConfiguracionKdbx(config) {
	await setDoc(refMeta('kdbx'), {
		filePath: config?.filePath || '',
		password: config?.password || '',
		actualizadoEn: new Date().toISOString(),
	});
}
