import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { inMemoryPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { esApp } from '@/Utils/plataforma';

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

let app = null;
let db = null;
let auth = null;

if (hasFirebaseConfig) {
	app = initializeApp(firebaseConfig);
	db = getFirestore(app);
	// Igual que antes: a app Android lembra a sesión entre aperturas; na web pídese o login cada vez.
	auth = initializeAuth(app, {
		persistence: esApp ? indexedDBLocalPersistence : inMemoryPersistence,
	});
}

export { app, db, auth, hasFirebaseConfig, firebaseConfig, firebaseSyncDoc };
