import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
let testEnv;

before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) return;

  testEnv = await initializeTestEnvironment({
    projectId: "demo-tgi-elevators",
    firestore: { rules }
  });
});

after(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (!testEnv) return;

  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/active-user"), { actif: true, role: "TECHNICIEN" });
    await setDoc(doc(db, "users/director"), { actif: true, role: "DIRECTEUR" });
    await setDoc(doc(db, "users/inactive-user"), { actif: false, role: "TECHNICIEN" });
    await setDoc(doc(db, "clients/client-1"), { nom: "Client test" });
    await setDoc(doc(db, "factures/invoice-1"), { numero: "F-001" });
  });
});

test(
  "réserve la lecture et l'écriture aux utilisateurs actifs",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const activeDb = testEnv.authenticatedContext("active-user").firestore();
    const inactiveDb = testEnv.authenticatedContext("inactive-user").firestore();

    await assertSucceeds(getDoc(doc(activeDb, "clients/client-1")));
    await assertSucceeds(setDoc(doc(activeDb, "clients/client-2"), { nom: "Nouveau" }));
    await assertFails(getDoc(doc(inactiveDb, "clients/client-1")));
    await assertFails(setDoc(doc(inactiveDb, "clients/client-2"), { nom: "Interdit" }));
    await assertFails(
      getDoc(doc(testEnv.unauthenticatedContext().firestore(), "clients/client-1"))
    );
  }
);

test(
  "réserve les utilisateurs et paramètres au directeur actif",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const activeDb = testEnv.authenticatedContext("active-user").firestore();
    const directorDb = testEnv.authenticatedContext("director").firestore();

    await assertFails(getDoc(doc(activeDb, "users/director")));
    await assertFails(setDoc(doc(activeDb, "settings/general"), { tauxTVA: 0.2 }));
    await assertSucceeds(getDoc(doc(directorDb, "users/active-user")));
    await assertSucceeds(setDoc(doc(directorDb, "settings/general"), { tauxTVA: 0.2 }));
  }
);

test(
  "interdit la suppression physique des documents comptables",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const activeDb = testEnv.authenticatedContext("active-user").firestore();

    await assertFails(deleteDoc(doc(activeDb, "factures/invoice-1")));
    await assertFails(deleteDoc(doc(activeDb, "paiements/payment-1")));
    await assertFails(deleteDoc(doc(activeDb, "recus/receipt-1")));
    await assertSucceeds(deleteDoc(doc(activeDb, "clients/client-1")));
  }
);
