import { eloToCategory, CUTS_SOURCE_LABEL } from "./afpCuts";
import { looseIncludes } from "../nameVariants";

// Connecteur AFP (Association Francophone de Padel)
// Source: https://www.afpadel.be/point-elo/
// Endpoint public WordPress (DataTables server-side), pas d'authentification requise.

const ENDPOINT = "https://www.afpadel.be/wp-admin/admin-ajax.php";
const TIMEOUT_MS = 8000;

const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(str) {
  return str
    .replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;|&nbsp;/g, (m) => HTML_ENTITIES[m])
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(html) {
  // Extrait le texte visible d'un petit fragment HTML (ex: le <a>Nom</a> renvoyé par AFP)
  // et decode les entites HTML (ex: "&amp;" -> "&") qui peuvent rester dans le texte.
  return decodeEntities(
    String(html || "")
      .replace(/<[^>]*>/g, "")
      .trim()
  );
}

function extractHref(html) {
  const match = String(html || "").match(/href="([^"]+)"/);
  return match ? match[1] : null;
}

export async function searchAfp(nom, prenom) {
  // Le filtre "joueurs" cote AFP semble faire un match texte simple sur le nom
  // complet stocke (ordre "Prenom Nom"). Envoyer "Nom Prenom" concatene ne
  // matche rien. On cherche donc sur le nom seul (comportement valide
  // manuellement) et on filtre le prenom cote client si fourni.
  const query = (nom || prenom || "").trim();

  const body = new URLSearchParams({
    draw: "1",
    "columns[0][data]": "place",
    "columns[1][data]": "player",
    "columns[2][data]": "club",
    "columns[3][data]": "sex",
    "columns[4][data]": "points",
    start: "0",
    length: "25",
    action: "handle_ajax_ranking_elo_filter",
    joueurs: query,
    min: "0",
    max: "4000",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`AFP: HTTP ${res.status}`);
    }

    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];

    let results = rows.map((row) => {
      const points = row.points != null ? String(row.points) : null;
      const categorie = eloToCategory(row.points, row.sex);
      const lien = extractHref(row.player);
      return {
        federation: "AFP",
        nom_complet: stripHtml(row.player),
        club: stripHtml(row.club),
        sexe: row.sex || null,
        classement: points,
        classement_type: "ELO",
        categorie, // ex: "P300", estimee a partir des seuils ci-dessous
        categorie_source: categorie ? CUTS_SOURCE_LABEL : null,
        lien, // ex: https://mon.afpadel.be/player/9220266/elo_history
      };
    });

    if (prenom) {
      const filtered = results.filter((r) => looseIncludes(r.nom_complet, prenom));
      // Ne filtre que si ca laisse au moins un resultat, pour ne pas
      // masquer un joueur si l'orthographe du prenom differe legerement.
      if (filtered.length > 0) results = filtered;
    }

    return results;
  } finally {
    clearTimeout(timeout);
  }
}
