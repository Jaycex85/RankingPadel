// Connecteur PWB (Padel Wallonie-Bruxelles / AFT padel)
// Source: https://player-padel.tppwb.be/Players/Search
// Endpoint public (autocomplete), pas d'authentification requise.

const ENDPOINT = "https://player-padel.tppwb.be/Players/GetPlayersAutocomplete";
const TIMEOUT_MS = 8000;

export async function searchPwb(nom, prenom) {
  const query = [nom, prenom].filter(Boolean).join(" ").trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text: query }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`PWB: HTTP ${res.status}`);
    }

    const players = await res.json();
    if (!Array.isArray(players)) return [];

    return players.map((p) => ({
      federation: "PWB",
      nom_complet: [p.Prenom, p.Nom].filter(Boolean).join(" "),
      club: null,
      sexe: null,
      classement: p.ClasmtDouble || null,
      classement_type: "Double",
      numero_federation: p.NumFed || null,
      lien: p.NumFed ? `https://player-padel.tppwb.be/Players/Detail/${p.NumFed}` : null,
    }));
  } finally {
    clearTimeout(timeout);
  }
}
