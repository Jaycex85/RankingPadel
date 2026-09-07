import { searchAfp } from "../../../lib/connectors/afp";
import { searchPwb } from "../../../lib/connectors/pwb";
import { searchTennisVlaanderen } from "../../../lib/connectors/tennisVlaanderen";
import { nameVariantCombos } from "../../../lib/nameVariants";

// Ordre canonique des paliers de classement (commun aux 3 federations,
// prefixe P ou WD ignore). Sert a comparer les niveaux entre federations
// sans dependre de leur echelle brute (Elo AFP vs categorie directe ailleurs).
const TIER_ORDER = [25, 50, 100, 200, 300, 400, 500, 700, 1000];

function tierIndex(value) {
  if (value == null) return null;
  const exact = TIER_ORDER.indexOf(value);
  if (exact !== -1) return exact;
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    if (value >= TIER_ORDER[i]) return i;
  }
  return 0;
}

function extractNiveau(result) {
  const source = result.categorie || result.classement || "";
  const match = String(source).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function dedupeKey(r) {
  return [r.federation, r.nom_complet, r.classement].join("\u0000");
}

async function runConnectorWithVariants(searchFn, combos) {
  const settled = await Promise.allSettled(combos.map(([n, p]) => searchFn(n, p)));

  const merged = new Map();
  let lastError = null;

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      for (const row of outcome.value) {
        merged.set(dedupeKey(row), row);
      }
    } else {
      lastError = outcome.reason;
    }
  }

  // On ne remonte l'erreur que si AUCUNE des variantes n'a rien renvoye.
  if (merged.size === 0 && lastError) throw lastError;

  return Array.from(merged.values());
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nom = (searchParams.get("nom") || "").trim();
  const prenom = (searchParams.get("prenom") || "").trim();

  if (!nom && !prenom) {
    return Response.json(
      { error: "Merci de fournir au moins un nom ou un prenom." },
      { status: 400 }
    );
  }

  const combos = nameVariantCombos(nom, prenom);

  const connectors = [
    { federation: "AFP", run: () => runConnectorWithVariants(searchAfp, combos) },
    { federation: "PWB", run: () => runConnectorWithVariants(searchPwb, combos) },
    {
      federation: "Tennis Vlaanderen",
      run: () => runConnectorWithVariants(searchTennisVlaanderen, combos),
    },
  ];

  const settled = await Promise.allSettled(connectors.map((c) => c.run()));

  const results = [];
  const errors = [];

  settled.forEach((outcome, i) => {
    const federation = connectors[i].federation;
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value.map((r) => ({ ...r, niveau: extractNiveau(r) })));
    } else {
      errors.push({ federation, message: String(outcome.reason?.message || outcome.reason) });
    }
  });

  // Detection d'ecart de niveau entre federations (le coeur du besoin : un
  // joueur avec un classement nettement plus haut ailleurs).
  const niveaux = results
    .map((r) => ({ federation: r.federation, tier: tierIndex(r.niveau) }))
    .filter((r) => r.tier != null);

  let alerte = null;
  if (niveaux.length >= 2) {
    const max = niveaux.reduce((a, b) => (b.tier > a.tier ? b : a));
    const min = niveaux.reduce((a, b) => (b.tier < a.tier ? b : a));
    if (max.tier - min.tier >= 2) {
      alerte = {
        federation_haute: max.federation,
        federation_basse: min.federation,
        ecart_paliers: max.tier - min.tier,
      };
    }
  }

  return Response.json({ query: { nom, prenom }, results, errors, alerte });
}
