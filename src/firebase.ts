/// <reference types="vite/client" />

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const hasRealConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForViteDevTestingPurposeOnly",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef1234567890",
};

// Determine if all required Firebase environment configurations are populated
export const isFirebaseConfigured = hasRealConfig;

let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Failed to initialize Firebase SDK:", error);
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Operational Types for Firestore Logged Error handling as mandated by standard skills
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Safely writes a new spin record into the user's specific Firestore subcollection.
 */
export async function addSpinRecord(uid: string, hitEvent: string, change: number, dailyTotal: number) {
  if (!isFirebaseConfigured) return;
  const path = `users/${uid}/spins`;
  try {
    const parentRef = collection(db, 'users', uid, 'spins');
    const newRecord = {
      timestamp: Timestamp.now(),
      hitEvent,
      change,
      dailyTotal,
    };
    await addDoc(parentRef, newRecord);
    console.log("Write success to Firestore path:", path, newRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Safely saves the user's complete layout configuration and state in Firestore.
 */
export async function saveUserState(
  uid: string,
  state: {
    registryEvents: any[];
    wheelItems: any[];
    currentPoints: number;
    logs: any[];
    protagonistRecords: any[];
  }
) {
  if (!isFirebaseConfigured) return;
  const path = `users/${uid}/userData/config`;
  try {
    const docRef = doc(db, 'users', uid, 'userData', 'config');
    await setDoc(docRef, {
      registryEvents: state.registryEvents,
      wheelItems: state.wheelItems,
      currentPoints: state.currentPoints,
      logs: state.logs,
      protagonistRecords: state.protagonistRecords,
      updatedAt: Timestamp.now()
    });
    console.log("Successfully saved user state to Cloud:", path);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Safely loads the user's complete layout configuration and state from Firestore.
 */
export async function getUserState(uid: string) {
  if (!isFirebaseConfigured) return null;
  const path = `users/${uid}/userData/config`;
  try {
    const docRef = doc(db, 'users', uid, 'userData', 'config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

