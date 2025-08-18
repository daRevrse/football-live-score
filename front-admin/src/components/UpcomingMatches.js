import React, { useEffect, useState } from "react";
import { Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { getUpcomingMatches } from "../services/api";
import PublicMatchCard from "./PublicMatchCard";
import { styles } from "./PublicMatchList";

export default function UpcomingMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      try {
        const upcomingMatches = await getUpcomingMatches();
        setMatches(upcomingMatches);
      } catch (err) {
        setError("Erreur de chargement des matchs à venir");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw
            size={48}
            style={{ animation: "spin 2s linear infinite", color: "#3b82f6" }}
          />
          <div style={styles.loadingText}>Chargement des matchs à venir...</div>
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
          <Calendar size={32} />
          Matchs à venir
        </h1>
        <div style={styles.subtitle}>Prochains matchs programmés</div>
      </div>

      {matches.length === 0 ? (
        <div style={styles.emptyState}>
          <Calendar
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
            Aucun match à venir
          </h3>
          <p style={{ fontSize: "16px", margin: 0 }}>
            Les prochains matchs programmés apparaîtront ici
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {matches
            .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
            .map((match) => (
              <PublicMatchCard key={match.id} match={match} />
            ))}
        </div>
      )}
    </div>
  );
}
