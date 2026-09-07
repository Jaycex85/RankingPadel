// Genere des variantes d'un nom/prenom pour maximiser les chances de match
// cote federations, qui n'ont pas toutes le meme comportement de recherche
// (certaines sont sensibles aux accents et/ou aux tirets).

function stripDiacritics(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function swapHyphenSpace(value) {
  if (value.includes("-")) return value.replace(/-/g, " ");
  if (value.includes(" ")) return value.replace(/ /g, "-");
  return null;
}

/**
 * Retourne un tableau de variantes uniques pour une valeur donnee, par
 * exemple "Frédéric" -> ["Frédéric", "Frederic"], ou
 * "Jean-Paul" -> ["Jean-Paul", "Jean Paul", "Jean-Paul", "Jean Paul"] (dedupliqué).
 * Plafonne a 4 variantes pour ne pas multiplier les appels reseau a l'infini.
 */
export function nameVariants(rawValue) {
  const value = (rawValue || "").trim();
  if (!value) return [""];

  const variants = new Set([value]);
  variants.add(stripDiacritics(value));

  const swapped = swapHyphenSpace(value);
  if (swapped) {
    variants.add(swapped);
    variants.add(stripDiacritics(swapped));
  }

  return Array.from(variants).slice(0, 4);
}

/**
 * Construit jusqu'a `maxCombos` couples [nom, prenom] a partir des variantes
 * respectives, en alignant les listes par index plutot qu'en faisant un
 * produit cartesien complet (qui multiplierait trop les appels reseau).
 */
export function nameVariantCombos(nom, prenom, maxCombos = 4) {
  const nomVariants = nameVariants(nom);
  const prenomVariants = nameVariants(prenom);
  const length = Math.min(maxCombos, Math.max(nomVariants.length, prenomVariants.length));

  const combos = [];
  const seen = new Set();

  for (let i = 0; i < length; i++) {
    const n = nomVariants[i % nomVariants.length];
    const p = prenomVariants[i % prenomVariants.length];
    const key = `${n}\u0000${p}`;
    if (!seen.has(key)) {
      seen.add(key);
      combos.push([n, p]);
    }
  }

  return combos;
}

/** Comparaison "souple" de deux chaines : insensible a la casse, aux accents et aux tirets/espaces. */
export function looseEquals(a, b) {
  const normalize = (v) => stripDiacritics((v || "").toLowerCase()).replace(/[-\s]+/g, " ").trim();
  return normalize(a) === normalize(b);
}

export function looseIncludes(haystack, needle) {
  const normalize = (v) => stripDiacritics((v || "").toLowerCase()).replace(/[-\s]+/g, " ").trim();
  return normalize(haystack).includes(normalize(needle));
}
