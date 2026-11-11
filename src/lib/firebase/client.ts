"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export class FirebaseConfigurationError extends Error {
  readonly code = "firebase/configuration-incomplete";

  constructor() {
    super("La configuration Firebase côté navigateur est incomplète.");
    this.name = "FirebaseConfigurationError";
  }
}

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean);
}

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) throw new FirebaseConfigurationError();

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const emulatorState = globalThis as typeof globalThis & {
    __tgiAuthEmulatorConnected?: boolean;
  };

  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
    !emulatorState.__tgiAuthEmulatorConnected
  ) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true
    });
    emulatorState.__tgiAuthEmulatorConnected = true;
  }

  return auth;
}
