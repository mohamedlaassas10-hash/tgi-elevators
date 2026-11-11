import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFile } from "node:fs/promises";

const rules = await readFile(
  new URL("../../../../firestore.rules", import.meta.url),
  "utf8"
);
let testEnv: Awaited<ReturnType<typeof initializeTestEnvironment>> | undefined;

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

test(
  "interdit aux utilisateurs actifs la lecture et l'écriture des compteurs",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    assert.ok(testEnv);
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/active-user"), {
        actif: true,
        role: "TECHNICIEN"
      });
    });

    const activeDb = testEnv.authenticatedContext("active-user").firestore();
    const counter = doc(activeDb, "counters/DEV-2026");

    await assertFails(getDoc(counter));
    await assertFails(setDoc(counter, { value: 1 }));
  }
);
