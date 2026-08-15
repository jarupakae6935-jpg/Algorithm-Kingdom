import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { FirebaseConfigType } from '../types';

const DEFAULT_CONFIG_KEY = 'custom_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfigType | null {
  try {
    const raw = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.apiKey !== 'YOUR_API_KEY' && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved firebase config', e);
  }

  // Check window object from firebase-config.js if defined and not default placeholder
  if (typeof window !== 'undefined' && (window as any).FIREBASE_CONFIG) {
    const cfg = (window as any).FIREBASE_CONFIG;
    if (cfg && cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY' && cfg.projectId && cfg.projectId !== 'algorithm-adventure-2bbec') {
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

  if (!cfg || !cfg.apiKey || cfg.apiKey === 'YOUR_API_KEY' || !cfg.projectId) {
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

export interface FirebaseConnectionStatus {
  status: 'live' | 'demo' | 'error';
  message: string;
  projectId?: string;
}

export async function testFirebaseConnection(): Promise<FirebaseConnectionStatus> {
  const { db, isLive } = initFirebase();
  const cfg = getStoredFirebaseConfig();

  if (!isLive || !db || !cfg) {
    return {
      status: 'demo',
      message: 'อยู่ในโหมดตัวอย่าง (Demo Mode) - ข้อมูลบันทึกเฉพาะในเครื่องนี้'
    };
  }

  try {
    // Ping firestore by querying classrooms collection with limit 1
    const q = query(collection(db, 'classrooms'), limit(1));
    await getDocs(q);
    return {
      status: 'live',
      message: 'เชื่อมต่อ Firestore ออนไลน์สำเร็จ ข้อมูลซิงก์ข้ามอุปกรณ์ได้ 24 ชม.',
      projectId: cfg.projectId
    };
  } catch (err: any) {
    console.error('Firebase connection test failed:', err);
    let errMsg = err?.message || 'ไม่สามารถเชื่อมต่อ Firestore ได้';
    if (err?.code === 'permission-denied' || errMsg.includes('permission')) {
      errMsg = 'ติดสิทธิ์ความปลอดภัย (Permission Denied) - กรุณาตั้งค่า Firestore Rules ให้ allow read, write: if true;';
    } else if (err?.code === 'unavailable') {
      errMsg = 'ไม่สามารถติดต่อเซิร์ฟเวอร์ Firebase ได้ หรือยังไม่ได้สร้าง Firestore Database';
    }
    return {
      status: 'error',
      message: errMsg,
      projectId: cfg.projectId
    };
  }
}

