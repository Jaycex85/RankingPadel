// Table de seuils ("Cuts") AFP pour convertir les points Elo en categorie (P100, P200...).
// Ces seuils sont recalcules par l'AFP 2x/an (juin et decembre) selon la
// distribution reelle des points Elo de tous les joueurs affilies.
// A METTRE A JOUR a chaque publication d'un nouveau document "Cuts" par l'AFP
// (cherche "AFPadel Classements <annee>" sur afpadel.be).

export const CUTS_SOURCE_LABEL = "Cuts AFP 2024 - 2e semestre (23/06/2024)";

// Seuils minimums (points Elo) pour atteindre chaque categorie, du plus bas au plus haut.
const CUTS_HOMMES = [
  { category: "P100", min: 1 },
  { category: "P200", min: 273 },
  { category: "P300", min: 528 },
  { category: "P400", min: 887 },
  { category: "P500", min: 1403 },
  { category: "P700", min: 1875 },
  { category: "P1000", min: 2289 },
];

const CUTS_DAMES = [
  { category: "P50", min: 1 },
  { category: "P100", min: 104 },
  { category: "P200", min: 287 },
  { category: "P300", min: 669 },
  { category: "P500", min: 1151 },
  { category: "P700", min: 2084 },
];

function normalizeSex(sex) {
  const s = (sex || "").trim().toLowerCase();
  if (s.startsWith("h") || s === "m" || s === "hommes") return "hommes";
  if (s.startsWith("d") || s === "f" || s === "dames") return "dames";
  return null;
}

/**
 * Convertit un nombre de points Elo AFP en categorie estimee (ex: "P300").
 * Retourne null si le sexe est inconnu/non fourni, ou si les points sont
 * en dessous du seuil le plus bas connu.
 */
export function eloToCategory(elo, sex) {
  const points = Number(elo);
  if (!Number.isFinite(points)) return null;

  const normalized = normalizeSex(sex);
  const table = normalized === "hommes" ? CUTS_HOMMES : normalized === "dames" ? CUTS_DAMES : null;
  if (!table) return null;

  let result = null;
  for (const step of table) {
    if (points >= step.min) result = step.category;
  }
  return result;
}
