import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFile } from "node:fs/promises";

const rules = await readFile(
  new URL("../../../../firestore.rules", import.meta.url),
  "utf8"
);
let testEnv: Awaited<ReturnType<typeof initializeTestEnvironment>> | undefined;

function getTestEnv() {
  if (!testEnv) throw new Error("L'émulateur Firestore n'est pas disponible.");
  return testEnv;
}

before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) return;

  testEnv = await initializeTestEnvironment({
    projectId: "demo-tgi-elevators-profile-rules",
    firestore: { rules }
  });
});

after(async () => {
  if (testEnv) await testEnv.cleanup();
});

test(
  "interdit aux utilisateurs actifs la lecture et l'écriture des compteurs",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const env = getTestEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/active-user"), {
        actif: true,
        role: "TECHNICIEN"
      });
    });

    const activeDb = env.authenticatedContext("active-user").firestore();
    const counter = doc(activeDb, "counters/DEV-2026");

    await assertFails(getDoc(counter));
    await assertFails(setDoc(counter, { value: 1 }));
  }
);

test(
  "un utilisateur actif lit son propre profil users/{uid}",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const env = getTestEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/commercial"), {
        actif: true,
        role: "COMMERCIAL"
      });
    });

    const commercialDb = env.authenticatedContext("commercial").firestore();
    await assertSucceeds(getDoc(doc(commercialDb, "users/commercial")));
  }
);

test(
  "un utilisateur actif ne lit pas le profil d'un autre utilisateur",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const env = getTestEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "users/commercial"), {
        actif: true,
        role: "COMMERCIAL"
      });
      await setDoc(doc(db, "users/directeur"), {
        actif: true,
        role: "DIRECTEUR"
      });
    });

    const commercialDb = env.authenticatedContext("commercial").firestore();
    await assertFails(getDoc(doc(commercialDb, "users/directeur")));
  }
);

test(
  "un utilisateur ne peut pas poser deletedAt sur une facture",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const env = getTestEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "users/active-user"), {
        actif: true,
        role: "COMMERCIAL"
      });
      await setDoc(doc(db, "factures/facture-1"), {
        numero: "FAC-2026-0001"
      });
    });

    const activeDb = env.authenticatedContext("active-user").firestore();
    await assertFails(
      updateDoc(doc(activeDb, "factures/facture-1"), {
        deletedAt: new Date()
      })
    );
  }
);

test(
  "un utilisateur actif peut créer une facture sans deletedAt",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const env = getTestEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/active-user"), {
        actif: true,
        role: "COMMERCIAL"
      });
    });

    const activeDb = env.authenticatedContext("active-user").firestore();
    await assertSucceeds(
      setDoc(doc(activeDb, "factures/facture-2"), {
        numero: "FAC-2026-0002",
        montantTTCentimes: 120_000
      })
    );
  }
);
