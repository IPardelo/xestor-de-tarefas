import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, hasFirebaseConfig } from '@/App/firebase';

const DEFAULT_SYNC_DOC = 'tarefas-shared/default';

const getSyncDocPath = () => import.meta.env.VITE_FIREBASE_SYNC_DOC || DEFAULT_SYNC_DOC;

const getSyncDocRef = () => {
	if (!db) return null;
	const [collectionName, docId] = getSyncDocPath().split('/');
	if (!collectionName || !docId) return null;
	return doc(db, collectionName, docId);
};

export const isCloudSyncEnabled = () => hasFirebaseConfig;

export async function cargarDatosApp() {
	if (!hasFirebaseConfig) {
		throw new Error('Firebase non está configurado');
	}

	const ref = getSyncDocRef();
	if (!ref) {
		throw new Error('Ruta de documento Firebase inválida');
	}

	const snapshot = await getDoc(ref);
	if (snapshot.exists()) {
		return snapshot.data();
	}
	return null;
}

export async function gardarDatosApp(data) {
	if (!hasFirebaseConfig) {
		throw new Error('Firebase non está configurado');
	}

	const ref = getSyncDocRef();
	if (!ref) {
		throw new Error('Ruta de documento Firebase inválida');
	}

	await setDoc(ref, data, { merge: false });
}

export function subscribirseADatosRemotos(onData, onError) {
	if (!hasFirebaseConfig) {
		return () => {};
	}

	const ref = getSyncDocRef();
	if (!ref) {
		onError?.(new Error('Ruta de documento Firebase inválida'));
		return () => {};
	}

	return onSnapshot(
		ref,
		(snapshot) => {
			if (!snapshot.exists()) return;
			onData(snapshot.data());
		},
		(error) => {
			onError?.(error);
		}
	);
}
