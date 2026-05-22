import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAuth, getAuth, type Auth, type Persistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig as exampleConfig } from './firebase.config.example';
import { initFirebaseAppCheck } from './appCheck';
import { logger } from '../utils/logger';

let firebaseConfig = { ...exampleConfig };

try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const local = require('./firebase.config') as {
        firebaseConfig?: typeof exampleConfig;
    };
    const cfg = local?.firebaseConfig;
    if (cfg?.apiKey && !cfg.apiKey.includes('YOUR_')) {
        firebaseConfig = cfg;
    }
} catch {
    // firebase.config.ts henüz oluşturulmadı — example config kullanılır
}

if (__DEV__ && firebaseConfig.apiKey.includes('YOUR_')) {
    logger.general.warn(
        'firebase.config.ts bulunamadı veya export eksik — yerel PIN modu kullanılır.'
    );
}

const PLACEHOLDER_VALUES = ['YOUR_API_KEY', 'YOUR_PROJECT_ID', ''];

function createAuthInstance(firebaseApp: FirebaseApp): Auth {
    try {
        // @firebase/auth RN build — Metro "react-native" alanını kullanır
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getReactNativePersistence } = require('@firebase/auth') as {
            getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
        };
        return initializeAuth(firebaseApp, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch {
        return getAuth(firebaseApp);
    }
}

export function isFirebaseConfigured(): boolean {
    const { apiKey, projectId, appId } = firebaseConfig;
    return (
        Boolean(apiKey && projectId && appId) &&
        !PLACEHOLDER_VALUES.includes(apiKey) &&
        !PLACEHOLDER_VALUES.includes(projectId)
    );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
    if (!isFirebaseConfigured()) return null;
    if (!app) {
        app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
        initFirebaseAppCheck(app);
    }
    return app;
}

export function getFirebaseAuth(): Auth | null {
    if (!isFirebaseConfigured()) return null;
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    if (!auth) {
        try {
            auth = createAuthInstance(firebaseApp);
        } catch {
            auth = getAuth(firebaseApp);
        }
    }
    return auth;
}

export function getFirebaseDb(): Firestore | null {
    if (!isFirebaseConfigured()) return null;
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    if (!db) {
        db = getFirestore(firebaseApp);
    }
    return db;
}

export { firebaseConfig };
