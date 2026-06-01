// lib/firebase-admin.ts — SDK do Firebase Admin (servidor)
import { getApps, initializeApp, cert, App } from "firebase-admin/app"
import { getAuth, Auth } from "firebase-admin/auth"

let _app: App | null = null
let _auth: Auth | null = null

function getAdminApp(): App {
  if (_app) return _app

  if (getApps().length > 0) {
    _app = getApps()[0]
    return _app
  }

  _app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      // Substituir \n escapado por quebra de linha real
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })

  return _app
}

export function getAdminAuth(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getAdminApp())
  return _auth
}

// Alias conveniente
export const adminAuth = {
  verifySessionCookie: (...args: Parameters<Auth["verifySessionCookie"]>) =>
    getAdminAuth().verifySessionCookie(...args),
  verifyIdToken: (...args: Parameters<Auth["verifyIdToken"]>) =>
    getAdminAuth().verifyIdToken(...args),
  createSessionCookie: (...args: Parameters<Auth["createSessionCookie"]>) =>
    getAdminAuth().createSessionCookie(...args),
}
