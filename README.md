# TGI Ascenseurs — ERP

Base de l'application de gestion de Technique Général Installation, à Casablanca.
L'interface est en français et les montants sont exprimés en MAD, avec une TVA
de référence de 20 %.

## Développement

- Node.js 22 en local (`.nvmrc`).
- Vercel doit utiliser Node.js 24.x en production.
- Copier `.env.local.example` vers `.env.local` et renseigner les identifiants
  Firebase avant d'utiliser l'authentification.
- `npm run dev` lance Next.js.
- `npm run emulators` lance les émulateurs Firebase Auth et Firestore.
- `npm run test:rules` vérifie les règles Firestore sur l'émulateur.

Les paramètres du service Firebase Admin sont réservés au serveur. Ne jamais
exposer `FIREBASE_PRIVATE_KEY` au navigateur.
