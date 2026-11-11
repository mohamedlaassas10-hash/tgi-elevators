import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY doivent être configurés."
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n")
    }),
    projectId
  });

const db = getFirestore(app);
await db.collection("settings").doc("general").set(
  {
    devise: "MAD",
    tauxTVA: 0.2,
    langue: "fr",
    updatedAt: FieldValue.serverTimestamp()
  },
  { merge: true }
);

console.log("Paramètres généraux TGI initialisés.");
