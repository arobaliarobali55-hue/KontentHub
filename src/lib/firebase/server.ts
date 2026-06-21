import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const apps = getApps();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const hasCredentials = Boolean(projectId && clientEmail && privateKey);

let app;
if (apps.length) {
  app = getApp();
} else if (hasCredentials) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey!.replace(/\\n/g, "\n"),
    }),
  });
} else {
  // Graceful fallback for build-time module evaluation when env variables are not yet provided
  app = initializeApp({
    projectId: projectId || "mock-project-id",
  });
}

export const db = getFirestore(app);
