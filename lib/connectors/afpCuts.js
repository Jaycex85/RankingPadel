// Table de seuils ("Cuts") AFP pour convertir les points Elo en categorie (P100, P200...).
// Ces seuils sont recalcules par l'AFP 2x/an (juin et decembre) selon la
// distribution reelle des points Elo de tous les joueurs affilies.
// Derniere mise a jour: table fournie directement par l'utilisateur (la plus recente).
// A METTRE A JOUR a chaque nouvelle table transmise par l'AFP.

export const CUTS_SOURCE_LABEL = "Table de Cuts AFP (2026)";

// Bornes [min, max] inclusives par categorie.
const CUTS_HOMMES = [
  { category: "P50", min: 0, max: 250 },
  { category: "P100", min: 251, max: 500 },
  { category: "P200", min: 501, max: 800 },
  { category: "P300", min: 801, max: 1200 },
  { category: "P400", min: 1201, max: 1600 },
  { category: "P500", min: 1601, max: 2000 },
  { category: "P700", min: 2001, max: 2600 },
  { category: "P1000", min: 2601, max: 9999 },
];

const CUTS_DAMES = [
  { category: "WD50", min: 0, max: 250 },
  { category: "WD100", min: 251, max: 500 },
  { category: "WD200", min: 501, max: 800 },
  { category: "WD300", min: 801, max: 1200 },
  { category: "WD400", min: 1201, max: 1600 },
  { category: "WD500", min: 1601, max: 9999 },
];

function normalizeSex(sex) {
  const s = (sex || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (s.startsWith("h") || s === "m") return "hommes";
  if (s.startsWith("d") || s.startsWith("f") || s === "w") return "dames";
  return null;
}

/**
 * Convertit un nombre de points Elo AFP en categorie estimee (ex: "P300").
 * Retourne null si le sexe est inconnu/non fourni, ou si les points ne
 * rentrent dans aucune tranche connue.
 */
export function eloToCategory(elo, sex) {
  const points = Number(elo);
  if (!Number.isFinite(points)) return null;

  const normalized = normalizeSex(sex);
  const table = normalized === "hommes" ? CUTS_HOMMES : normalized === "dames" ? CUTS_DAMES : null;
  if (!table) return null;

  const step = table.find((s) => points >= s.min && points <= s.max);
  return step ? step.category : null;
}
