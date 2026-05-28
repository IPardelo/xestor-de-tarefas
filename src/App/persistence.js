import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, hasFirebaseConfig } from '@/App/firebase';

const API_PATH = '/api/app-data';
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
	if (hasFirebaseConfig) {
		const ref = getSyncDocRef();
		if (ref) {
			const snapshot = await getDoc(ref);
			if (snapshot.exists()) {
				return snapshot.data();
			}
			return null;
		}
	}

	const resp = await fetch(API_PATH);
	if (!resp.ok) {
		throw new Error(`Erro ao cargar datos: ${resp.status}`);
	}
	return resp.json();
}

export async function gardarDatosApp(data) {
	if (hasFirebaseConfig) {
		const ref = getSyncDocRef();
		if (ref) {
			await setDoc(ref, data, { merge: false });
			return;
		}
	}

	await fetch(API_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
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
