import assert from "node:assert/strict";
import { describe, it } from "node:test";

const money = await import(new URL("./money.ts", import.meta.url).href);

describe("calculerLigne", () => {
  it("applique une remise de 100 %", () => {
    assert.deepEqual(
      money.calculerLigne({
        quantite: 2,
        prixUnitaireCentimes: 12_500,
        remisePourcent: 100,
        tvaPourcent: 20
      }),
      { htCentimes: 0, tvaCentimes: 0, ttcCentimes: 0 }
    );
  });

  it("retourne zéro pour une quantité nulle", () => {
    assert.deepEqual(
      money.calculerLigne({
        quantite: 0,
        prixUnitaireCentimes: 12_500,
        remisePourcent: 0,
        tvaPourcent: 20
      }),
      { htCentimes: 0, tvaCentimes: 0, ttcCentimes: 0 }
    );
  });

  it("arrondit les calculs au centime le plus proche", () => {
    assert.deepEqual(
      money.calculerLigne({
        quantite: 1,
        prixUnitaireCentimes: 1,
        remisePourcent: 0,
        tvaPourcent: 50
      }),
      { htCentimes: 1, tvaCentimes: 1, ttcCentimes: 2 }
    );
  });
});

describe("calculerTotaux", () => {
  it("additionne les montants entiers en centimes", () => {
    const lignes = [
      money.calculerLigne({
        quantite: 1,
        prixUnitaireCentimes: 10_001,
        remisePourcent: 0,
        tvaPourcent: 20
      }),
      money.calculerLigne({
        quantite: 2,
        prixUnitaireCentimes: 5_000,
        remisePourcent: 10,
        tvaPourcent: 20
      })
    ];

    assert.deepEqual(money.calculerTotaux(lignes), {
      htCentimes: 19_001,
      tvaCentimes: 3_800,
      ttcCentimes: 22_801
    });
  });
});

describe("formatMAD", () => {
  it("formate les milliers et les centimes sans calcul flottant", () => {
    assert.equal(money.formatMAD(142_000_050), "1 420 000,50 MAD");
    assert.equal(money.formatMAD(0), "0,00 MAD");
  });
});

describe("montantEnLettres", () => {
  const cas = [
    [0, "zéro dirhams"],
    [100, "un dirham"],
    [2_100, "vingt et un dirhams"],
    [10_000, "cent dirhams"],
    [100_000, "mille dirhams"],
    [
      142_000_050,
      "un million quatre cent vingt mille dirhams et cinquante centimes"
    ]
  ] as const;

  for (const [centimes, attendu] of cas) {
    it(`écrit ${money.formatMAD(centimes)} en lettres`, () => {
      assert.equal(money.montantEnLettres(centimes), attendu);
    });
  }
});
