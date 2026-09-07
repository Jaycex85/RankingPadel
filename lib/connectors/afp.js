// Connecteur AFP (Association Francophone de Padel)
// Source: https://www.afpadel.be/point-elo/
// Endpoint public WordPress (DataTables server-side), pas d'authentification requise.

const ENDPOINT = "https://www.afpadel.be/wp-admin/admin-ajax.php";
const TIMEOUT_MS = 8000;

function stripHtml(html) {
  // Extrait le texte visible d'un petit fragment HTML (ex: le <a>Nom</a> renvoyé par AFP)
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

export async function searchAfp(nom, prenom) {
  const query = [nom, prenom].filter(Boolean).join(" ").trim();

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

    return rows.map((row) => ({
      federation: "AFP",
      nom_complet: stripHtml(row.player),
      club: stripHtml(row.club),
      sexe: row.sex || null,
      classement: row.points != null ? String(row.points) : null,
      classement_type: "ELO",
    }));
  } finally {
    clearTimeout(timeout);
  }
}
