# RankingPadel

Verification du classement d'un joueur de padel dans les 3 federations belges
(AFP, PWB / AFT padel, Tennis Vlaanderen), a partir de son nom et prenom.

Aucune API officielle n'existe pour ces federations : les 3 connecteurs
interrogent les pages/endpoints publics de recherche de chaque site,
identifies par retro-ingenierie des requetes reseau (DevTools).

## Connecteurs

- **AFP** (`lib/connectors/afp.js`) : POST sur l'endpoint WordPress public
  `admin-ajax.php` (action `handle_ajax_ranking_elo_filter`) derriere la page
  https://www.afpadel.be/point-elo/. Renvoie du JSON.
- **PWB** (`lib/connectors/pwb.js`) : POST sur
  `https://player-padel.tppwb.be/Players/GetPlayersAutocomplete`. Renvoie du
  JSON deja structure (Nom, Prenom, ClasmtDouble...).
- **Tennis Vlaanderen** (`lib/connectors/tennisVlaanderen.js`) : GET sur
  `https://www.tennisenpadelvlaanderen.be/zoek-een-speler`, page rendue
  cote serveur (JSF/PrimeFaces). Le HTML est parse avec `cheerio` pour
  extraire chaque `.result-card--speler`.

## Route API

`GET /api/search?nom=...&prenom=...` interroge les 3 connecteurs en
parallele (`Promise.allSettled`) et renvoie :

```json
{
  "query": { "nom": "...", "prenom": "..." },
  "results": [
    { "federation": "AFP", "nom_complet": "...", "classement": "...", "club": "..." }
  ],
  "errors": []
}
```

Si un connecteur echoue (site en panne, structure changee), les 2 autres
repondent quand meme et l'erreur est listee a part.

## Developpement local

```bash
npm install
npm run dev
```

## Fragilite connue

Ces 3 connecteurs dependent de la structure actuelle des sites des
federations (endpoints internes, classes CSS). Si un site change son front,
le connecteur correspondant devra etre corrige. Chaque connecteur est isole
dans son propre fichier pour limiter l'impact d'un changement.
