import React, { useEffect, useState } from "react";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";
import { getLiveMatches } from "../services/api";
import socket from "../services/socket";
import PublicMatchCard from "./PublicMatchCard";
import { styles } from "./PublicMatchList"; // Réutilisation des styles

export default function LiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const liveMatches = await getLiveMatches();
        setMatches(liveMatches);
      } catch (err) {
        setError("Erreur de chargement des matchs en direct");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();

    const handleMatchUpdate = (updatedMatch) => {
      if (updatedMatch.status === "live") {
        setMatches((prev) =>
          prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
        );
      } else {
        // Si le match n'est plus en direct, le retirer de la liste
        setMatches((prev) => prev.filter((m) => m.id !== updatedMatch.id));
      }
    };

    socket.on("match_updated", handleMatchUpdate);
    socket.on("match:event", (payload) => {
      if (payload?.match) handleMatchUpdate(payload.match);
    });

    return () => {
      socket.off("match_updated");
      socket.off("match:event");
    };
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
            Chargement des matchs en direct...
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
          <Clock size={32} />
          Matchs en direct
        </h1>
        <div style={styles.subtitle}>
          Suivez les matchs en cours en temps réel
        </div>
      </div>

      {matches.length === 0 ? (
        <div style={styles.emptyState}>
          <Clock size={64} style={{ marginBottom: "24px", color: "#cbd5e1" }} />
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "700",
              margin: "0 0 12px 0",
            }}
          >
            Aucun match en direct
          </h3>
          <p style={{ fontSize: "16px", margin: 0 }}>
            Les matchs en cours apparaîtront ici automatiquement
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {matches.map((match) => (
            <PublicMatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
