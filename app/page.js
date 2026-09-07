"use client";

import { useState } from "react";

export default function Home() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
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
    } catch (err) {
      setResults([]);
      setErrors([{ federation: "global", message: "Erreur reseau" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>RankingPadel</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Verification du classement d'un joueur dans les 3 federations belges de padel.
      </p>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={{ flex: 1, minWidth: 120, padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Prenom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          style={{ flex: 1, minWidth: 120, padding: "0.5rem" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {searched && !loading && results.length === 0 && errors.length === 0 && (
        <p>Aucun resultat trouve.</p>
      )}

      {errors.length > 0 && (
        <div style={{ marginBottom: "1rem", color: "#a33" }}>
          {errors.map((err, i) => (
            <div key={i}>{err.federation}: indisponible ({err.message})</div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {results.map((r, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "0.75rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#888" }}>
              {r.federation}
            </div>
            <div style={{ fontWeight: 600 }}>{r.nom_complet}</div>
            <div>
              Classement: <strong>{r.classement || "?"}</strong>
              {r.classement_type ? ` (${r.classement_type})` : ""}
              {r.categorie && (
                <span style={{ marginLeft: 6, color: "#666" }}>
                  ~ {r.categorie} estime
                </span>
              )}
            </div>
            {r.categorie_source && (
              <div style={{ color: "#999", fontSize: "0.75rem" }}>{r.categorie_source}</div>
            )}
            {r.club && <div style={{ color: "#555", fontSize: "0.9rem" }}>{r.club}</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
