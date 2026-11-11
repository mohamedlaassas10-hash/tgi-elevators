export type Centimes = number;

type Rational = {
  numerator: bigint;
  denominator: bigint;
};

export function calculerLigne(args: {
  quantite: number;
  prixUnitaireCentimes: Centimes;
  remisePourcent: number;
  tvaPourcent: number;
}): {
  htCentimes: Centimes;
  tvaCentimes: Centimes;
  ttcCentimes: Centimes;
} {
  const quantite = decimalRatio(args.quantite, "La quantité");
  const remise = decimalRatio(args.remisePourcent, "La remise");
  const tva = decimalRatio(args.tvaPourcent, "La TVA");

  assertCentimes(args.prixUnitaireCentimes, "Le prix unitaire");
  if (args.prixUnitaireCentimes < 0) {
    throw new RangeError("Le prix unitaire ne peut pas être négatif.");
  }
  if (quantite.numerator < BigInt(0)) {
    throw new RangeError("La quantité ne peut pas être négative.");
  }
  if (
    remise.numerator < BigInt(0) ||
    remise.numerator > BigInt(100) * remise.denominator
  ) {
    throw new RangeError("La remise doit être comprise entre 0 et 100 %.");
  }
  if (tva.numerator < BigInt(0)) {
    throw new RangeError("La TVA ne peut pas être négative.");
  }

  const brutCentimes = arrondirRatio(
    BigInt(args.prixUnitaireCentimes) * quantite.numerator,
    quantite.denominator
  );
  const remiseCentimes = arrondirRatio(
    brutCentimes * remise.numerator,
    remise.denominator * BigInt(100)
  );
  const htCentimes = brutCentimes - remiseCentimes;
  const tvaCentimes = arrondirRatio(
    htCentimes * tva.numerator,
    tva.denominator * BigInt(100)
  );

  return {
    htCentimes: versCentimesSurs(htCentimes),
    tvaCentimes: versCentimesSurs(tvaCentimes),
    ttcCentimes: versCentimesSurs(htCentimes + tvaCentimes)
  };
}

export function calculerTotaux(
  lignes: Array<ReturnType<typeof calculerLigne>>
): {
  htCentimes: Centimes;
  tvaCentimes: Centimes;
  ttcCentimes: Centimes;
} {
  const totaux = lignes.reduce(
    (somme, ligne) => {
      assertCentimes(ligne.htCentimes, "Le total HT de la ligne");
      assertCentimes(ligne.tvaCentimes, "La TVA de la ligne");
      assertCentimes(ligne.ttcCentimes, "Le total TTC de la ligne");
      somme.ht += BigInt(ligne.htCentimes);
      somme.tva += BigInt(ligne.tvaCentimes);
      somme.ttc += BigInt(ligne.ttcCentimes);
      return somme;
    },
    { ht: BigInt(0), tva: BigInt(0), ttc: BigInt(0) }
  );

  return {
    htCentimes: versCentimesSurs(totaux.ht),
    tvaCentimes: versCentimesSurs(totaux.tva),
    ttcCentimes: versCentimesSurs(totaux.ttc)
  };
}

export function formatMAD(centimes: Centimes): string {
  assertCentimes(centimes, "Le montant");

  const montant = BigInt(centimes);
  const signe = montant < BigInt(0) ? "-" : "";
  const absolu = montant < BigInt(0) ? -montant : montant;
  const dirhams = (absolu / BigInt(100)).toString();
  const centimesRestants = (absolu % BigInt(100)).toString().padStart(2, "0");
  const dirhamsGroupes = dirhams.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${signe}${dirhamsGroupes},${centimesRestants} MAD`;
}

export function montantEnLettres(centimes: Centimes): string {
  assertCentimes(centimes, "Le montant");

  const montant = BigInt(centimes);
  const signe = montant < BigInt(0) ? "moins " : "";
  const absolu = montant < BigInt(0) ? -montant : montant;
  const dirhams = absolu / BigInt(100);
  const centimesRestants = Number(absolu % BigInt(100));
  const nombreDirhams = nombreEnLettres(dirhams);
  const libelleDirham =
    dirhams === BigInt(0) || dirhams === BigInt(1) ? "dirham" : "dirhams";

  if (centimesRestants === 0) {
    return `${signe}${nombreDirhams} ${libelleDirham}`;
  }

  const libelleCentime = centimesRestants === 1 ? "centime" : "centimes";
  return `${signe}${nombreDirhams} ${libelleDirham} et ${nombreEnLettres(
    BigInt(centimesRestants)
  )} ${libelleCentime}`;
}

function assertCentimes(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      `${label} doit être un nombre entier sûr de centimes.`
    );
  }
}

function decimalRatio(value: number, label: string): Rational {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} doit être un nombre fini.`);
  }

  const [coefficient, exponentText] = value.toString().toLowerCase().split("e");
  const [whole, fractional = ""] = coefficient.split(".");
  const exponent = exponentText ? Number(exponentText) : 0;
  let numerator = BigInt(`${whole}${fractional}`);
  const scale = fractional.length - exponent;

  if (scale > 0) {
    return {
      numerator,
      denominator: BigInt(10) ** BigInt(scale)
    };
  }

  if (scale < 0) {
    numerator *= BigInt(10) ** BigInt(-scale);
  }

  return { numerator, denominator: BigInt(1) };
}

function arrondirRatio(numerator: bigint, denominator: bigint): bigint {
  return (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
}

function versCentimesSurs(value: bigint): Centimes {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(0)) {
    throw new RangeError(
      "Le montant calculé dépasse la plage sûre en centimes."
    );
  }
  return Number(value);
}

function nombreEnLettres(value: bigint): string {
  if (value < BigInt(1000)) return moinsDeMille(Number(value));

  const echelles = [
    { valeur: BigInt(1_000_000_000_000), nom: "billion", pluriel: "billions" },
    { valeur: BigInt(1_000_000_000), nom: "milliard", pluriel: "milliards" },
    { valeur: BigInt(1_000_000), nom: "million", pluriel: "millions" },
    { valeur: BigInt(1000), nom: "mille", pluriel: "mille" }
  ];

  for (const echelle of echelles) {
    if (value < echelle.valeur) continue;

    const quotient = value / echelle.valeur;
    const reste = value % echelle.valeur;
    const partie =
      echelle.nom === "mille" && quotient === BigInt(1)
        ? "mille"
        : `${nombreEnLettres(quotient)} ${
            quotient > BigInt(1) ? echelle.pluriel : echelle.nom
          }`;

    return reste === BigInt(0)
      ? partie
      : `${partie} ${nombreEnLettres(reste)}`;
  }

  throw new RangeError(
    "Le montant est trop grand pour être écrit en lettres."
  );
}

function moinsDeMille(value: number): string {
  const unites = [
    "zéro",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf"
  ];
  const speciaux = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize"
  ];
  const dizaines = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante"
  ];

  if (value < 10) return unites[value];
  if (value < 17) return speciaux[value - 10];
  if (value < 20) return `dix-${unites[value - 10]}`;

  if (value < 70) {
    const dizaine = Math.floor(value / 10);
    const unite = value % 10;
    if (unite === 0) return dizaines[dizaine];
    if (unite === 1) return `${dizaines[dizaine]} et un`;
    return `${dizaines[dizaine]}-${unites[unite]}`;
  }

  if (value < 80) {
    return value === 71
      ? "soixante et onze"
      : `soixante-${moinsDeMille(value - 60)}`;
  }

  if (value < 100) {
    return value === 80
      ? "quatre-vingts"
      : `quatre-vingt-${moinsDeMille(value - 80)}`;
  }

  const centaines = Math.floor(value / 100);
  const reste = value % 100;
  const prefixe = centaines === 1 ? "cent" : `${unites[centaines]} cent`;
  const prefixeAvecAccord =
    reste === 0 && centaines > 1 ? `${prefixe}s` : prefixe;

  return reste === 0
    ? prefixeAvecAccord
    : `${prefixe} ${moinsDeMille(reste)}`;
}
