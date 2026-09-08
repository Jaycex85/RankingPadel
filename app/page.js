"use client";

import { useState } from "react";
import styles from "./page.module.css";

function CourtMark() {
  // Petit trait de lignes de court, en clin d'oeil au double service line du padel.
  return (
    <svg className={styles["court-mark"]} viewBox="0 0 60 40" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="58" height="38" rx="3" stroke="var(--ball-lime)" strokeWidth="2" />
      <line x1="30" y1="1" x2="30" y2="39" stroke="var(--ball-lime)" strokeWidth="1.5" />
      <line x1="1" y1="14" x2="59" y2="14" stroke="var(--ball-lime)" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

function federationLabel(code) {
  if (code === "AFP") return "AFP";
  if (code === "PWB") return "PWB / AFT padel";
  if (code === "Tennis Vlaanderen") return "Tennis Vlaanderen";
  return code;
}

export default function Home() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [alerte, setAlerte] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!nom.trim() && !prenom.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ nom, prenom });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
      setErrors(data.errors || []);
      setAlerte(data.alerte || null);
    } catch (err) {
      setResults([]);
      setErrors([{ federation: "global", message: "Erreur reseau" }]);
      setAlerte(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <CourtMark />
        <h1 className={styles.title}>RankingPadel</h1>
        <p className={styles.tagline}>Classements dans les trois federations</p>
      </header>

      <form onSubmit={handleSearch} className={styles.searchPanel}>
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="prenom">Prénom</label>
            <input
              id="prenom"
              type="text"
              placeholder="Prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              type="text"
              placeholder="Nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </div>
      </form>

      {alerte && (
        <div className={styles.alert}>
          <span className={styles.alertDot} aria-hidden="true" />
          <div>
            <p className={styles.alertTitle}>Ecart de niveau detecte</p>
            <p className={styles.alertBody}>
              Classement nettement plus haut en {federationLabel(alerte.federation_haute)} que
              en {federationLabel(alerte.federation_basse)} ({alerte.ecart_paliers} paliers
              d&apos;ecart). A verifier avant validation d&apos;une inscription en serie basse.
            </p>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div>
          {errors.map((err, i) => (
            <div key={i} className={styles.errorLine}>
              {federationLabel(err.federation)} indisponible pour cette recherche ({err.message})
            </div>
          ))}
        </div>
      )}

      {searched && !loading && results.length === 0 && errors.length === 0 && (
        <p className={styles.emptyState}>
          Aucun joueur trouve avec ce nom, dans aucune des 3 federations.
        </p>
      )}

      <div className={styles.results}>
        {results.map((r, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardFederation}>{federationLabel(r.federation)}</div>
            <div className={styles.cardName}>{r.nom_complet}</div>

            <div className={styles.scoreRow}>
              <span className={styles.scoreValue}>{r.classement || "?"}</span>
              {r.classement_type && <span className={styles.scoreType}>{r.classement_type}</span>}
            </div>

            {r.categorie && (
              <div className={styles.categoryBadge}>
                Catégorie minimale autorisée <strong>{r.categorie}</strong>
              </div>
            )}

            <div className={styles.cardMeta}>
              {[r.club, r.sexe].filter(Boolean).join(" · ") || "Club et sexe non communiques"}
            </div>

            {r.categorie_source && <div className={styles.cardSource}>{r.categorie_source}</div>}
          </div>
        ))}
      </div>

      <p className={styles.footerNote}>
        Les classements affiches proviennent des pages publiques de recherche de chaque
        federation. La categorie AFP est estimee a partir des points Elo bruts et des
        derniers paliers connus (Cut 2026).
      </p>
    </main>
  );
}
