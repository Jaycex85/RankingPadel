// Connecteur Tennis en Padel Vlaanderen
// Source: https://www.tennisenpadelvlaanderen.be/zoek-een-speler
// Page rendue server-side (JSF/PrimeFaces) : pas de JSON, on parse le HTML final.
// sportId=2 => padel, pyramidId=6 => classement individuel padel

import * as cheerio from "cheerio";
import { looseIncludes } from "../nameVariants";

const BASE_URL = "https://www.tennisenpadelvlaanderen.be/zoek-een-speler";
const SITE_ROOT = "https://www.tennisenpadelvlaanderen.be";
const TIMEOUT_MS = 10000;

export async function searchTennisVlaanderen(nom, prenom) {
  const params = new URLSearchParams({
    sportId: "2",
    pyramidId: "6",
  });
  if (nom) params.set("playerName", nom);
  if (prenom) params.set("playerFirstName", prenom);

  const url = `${BASE_URL}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`Tennis Vlaanderen: HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const results = [];

    $(".result-card.result-card--speler").each((_, el) => {
      const card = $(el);
      const nomComplet = card.find(".speler-info h5").first().text().trim();

      const infoP = card.find(".speler-info p").first();
      // Le <p> contient un <span>club |</span> <span>sexe</span>
      const spans = infoP.find("span").map((__, s) => $(s).text().trim()).get();
      const club = (spans[0] || "").replace(/\|\s*$/, "").trim() || null;
      const sexe = spans[1] || null;

      let classementPadel = null;
      card.find(".d-flex.flex-column.gap-1").each((__, block) => {
        const label = $(block).find("p").first().text().trim();
        if (label.toLowerCase() === "padel") {
          classementPadel = $(block).find("b").first().text().trim() || null;
        }
      });

      // Bouton "Profiel bekijken" -> href relatif (ex: /dashboard?userId=1564555)
      const profileHref = card.find("a.tvl-cta-btn").first().attr("href");
      const lien = profileHref
        ? profileHref.startsWith("http")
          ? profileHref
          : `${SITE_ROOT}${profileHref}`
        : null;

      if (nomComplet) {
        results.push({
          federation: "Tennis Vlaanderen",
          nom_complet: nomComplet,
          club,
          sexe,
          classement: classementPadel,
          classement_type: "Padel",
          lien,
        });
      }
    });

    return results.filter((r) => {
      const nomOk = nom ? looseIncludes(r.nom_complet, nom) : true;
      const prenomOk = prenom ? looseIncludes(r.nom_complet, prenom) : true;
      return nomOk && prenomOk;
    });
  } finally {
    clearTimeout(timeout);
  }
}
