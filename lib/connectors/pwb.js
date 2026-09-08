// Connecteur PWB (Padel Wallonie-Bruxelles / AFT padel)
// Source: https://player-padel.tppwb.be/Players/Search
// Endpoint public (autocomplete), pas d'authentification requise.
// La fiche detail individuelle (Players/Detail/{numFed}) est en revanche
// exclue par le robots.txt du site -- scrapee ici de maniere deliberee et
// ponctuelle, a la demande explicite de l'utilisateur, pas en crawl de masse.

import * as cheerio from "cheerio";

const SEARCH_ENDPOINT = "https://player-padel.tppwb.be/Players/GetPlayersAutocomplete";
const DETAIL_URL = (numFed) => `https://player-padel.tppwb.be/Players/Detail/${numFed}`;
const TIMEOUT_MS = 8000;
const DETAIL_TIMEOUT_MS = 8000;

async function fetchPwbDetail(numFed) {
  if (!numFed) return { club: null, sexe: null };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETAIL_TIMEOUT_MS);

  try {
    const res = await fetch(DETAIL_URL(numFed), { signal: controller.signal });
    if (!res.ok) return { club: null, sexe: null };

    const html = await res.text();
    const $ = cheerio.load(html);

    let club = null;
    let sexe = null;

    // Les paires <dt>/<dd> se suivent dans le meme <dl class="grid">
    $("dl.grid dt").each((_, dtEl) => {
      const label = $(dtEl).text().trim().toLowerCase();
      const dd = $(dtEl).next("dd");

      if (label === "club") {
        club = dd.find("a").first().text().trim() || dd.text().trim() || null;
      }

      if (label === "sexe") {
        const iconClass = dd.find("i").first().attr("class") || "";
        if (iconClass.includes("mars")) sexe = "Homme";
        else if (iconClass.includes("venus")) sexe = "Femme";
      }
    });

    // Fallback sur l'image de profil si l'icone n'a pas suffi
    if (!sexe) {
      const imgSrc = $("image.profile, img.profile").first().attr("src") || "";
      if (imgSrc.includes("male") && !imgSrc.includes("female")) sexe = "Homme";
      else if (imgSrc.includes("female")) sexe = "Femme";
    }

    return { club, sexe };
  } catch {
    return { club: null, sexe: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchPwb(nom, prenom) {
  const query = [nom, prenom].filter(Boolean).join(" ").trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let players;
  try {
    const res = await fetch(SEARCH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text: query }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`PWB: HTTP ${res.status}`);
    }

    players = await res.json();
    if (!Array.isArray(players)) return [];
  } finally {
    clearTimeout(timeout);
  }

  // Enrichissement club/sexe via la fiche individuelle, en parallele.
  const details = await Promise.allSettled(
    players.map((p) => fetchPwbDetail(p.NumFed))
  );

  return players.map((p, i) => {
    const detail = details[i].status === "fulfilled" ? details[i].value : { club: null, sexe: null };
    return {
      federation: "PWB",
      nom_complet: [p.Prenom, p.Nom].filter(Boolean).join(" "),
      club: detail.club,
      sexe: detail.sexe,
      classement: p.ClasmtDouble || null,
      classement_type: "Padel",
      numero_federation: p.NumFed || null,
      lien: p.NumFed ? DETAIL_URL(p.NumFed) : null,
    };
  });
}
