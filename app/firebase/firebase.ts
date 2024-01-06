import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'
// eslint-disable-next-line import/no-extraneous-dependencies
import { getApp, getApps, initializeApp } from 'firebase/app'

import process from 'process'

const FIREBASE_API = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

const app = !getApps().length ? initializeApp(FIREBASE_API) : getApp()

const firestore = getFirestore(app)

const storage = getStorage(app)

export { storage, firestore }
