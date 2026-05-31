import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];

const hasFirebaseConfig = requiredKeys.every((key) => !!firebaseConfig[key]);
const firebaseSyncDoc = import.meta.env.VITE_FIREBASE_SYNC_DOC || 'tarefas-shared/default';

let db = null;

if (hasFirebaseConfig) {
	const app = initializeApp(firebaseConfig);
	db = getFirestore(app);
}

export { db, hasFirebaseConfig, firebaseConfig, firebaseSyncDoc };
