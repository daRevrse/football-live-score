import React, { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { getCompletedMatches } from "../services/api";
import PublicMatchCard from "./PublicMatchCard";
import { styles } from "./PublicMatchList";
import PublicMatchDetail from "./PublicMatchDetail";

export default function CompletedMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const fetchCompletedMatches = async () => {
      try {
        const completedMatches = await getCompletedMatches();
        setMatches(completedMatches);
      } catch (err) {
        setError("Erreur de chargement des matchs terminés");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedMatches();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw
            size={48}
            style={{ animation: "spin 2s linear infinite", color: "#3b82f6" }}
          />
          <div style={styles.loadingText}>
            Chargement des matchs terminés...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorAlert}>
          <AlertCircle size={24} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <CheckCircle size={32} />
          Matchs terminés
        </h1>
        <div style={styles.subtitle}>Résultats des matchs passés</div>
      </div>

      {matches.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckCircle
            size={64}
            style={{ marginBottom: "24px", color: "#cbd5e1" }}
          />
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "700",
              margin: "0 0 12px 0",
            }}
          >
            Aucun match terminé récemment
          </h3>
          <p style={{ fontSize: "16px", margin: 0 }}>
            Les résultats des matchs apparaîtront ici après leur fin
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {matches
            .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
            .map((match) => (
              <PublicMatchCard
                key={match.id}
                match={match}
                onClick={() => setSelectedMatch(match)}
              />
            ))}
        </div>
      )}
      {selectedMatch && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              style={styles.closeButton}
              onClick={() => setSelectedMatch(null)}
            >
              &times;
            </button>
            <PublicMatchDetail
              match={selectedMatch}
              // teams={teams}
              onClose={() => setSelectedMatch(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
