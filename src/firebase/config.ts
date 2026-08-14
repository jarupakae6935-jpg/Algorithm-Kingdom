import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseConfigType } from '../types';

const DEFAULT_CONFIG_KEY = 'custom_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfigType | null {
  try {
    const raw = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.apiKey !== 'YOUR_API_KEY') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved firebase config', e);
  }

  // Check window object from firebase-config.js
  if (typeof window !== 'undefined' && (window as any).FIREBASE_CONFIG) {
    const cfg = (window as any).FIREBASE_CONFIG;
    if (cfg && cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY') {
      return cfg;
    }
  }

  return null;
}

export function isFirebaseInitialized(): boolean {
  return getStoredFirebaseConfig() !== null;
}

export function saveFirebaseConfig(cfg: FirebaseConfigType) {
  localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(cfg));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(DEFAULT_CONFIG_KEY);
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null; isLive: boolean } {
  const cfg = getStoredFirebaseConfig();

  if (!cfg || !cfg.apiKey || cfg.apiKey === 'YOUR_API_KEY') {
    return { app: null, auth: null, db: null, isLive: false };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(cfg);
    } else {
      appInstance = getApps()[0];
    }
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    return { app: appInstance, auth: authInstance, db: dbInstance, isLive: true };
  } catch (e) {
    console.warn('Firebase initialization failed. Falling back to Demo Mode:', e);
    return { app: null, auth: null, db: null, isLive: false };
  }
}
