// ==================== MANAGER MATCHES PAGE ====================
// front-admin/src/pages/manager/TeamMatches.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMatches } from "../../services/api";
import { Calendar, Clock, MapPin } from "lucide-react";
import { styles } from "./styles";

const TeamMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, completed

  useEffect(() => {
    loadMatches();
  }, [filter]);

  const loadMatches = async () => {
    try {
      const response = await getMatches({
        teamId: user?.teamId,
      });

      let filteredMatches = response.data;

      if (filter === "upcoming") {
        filteredMatches = response.data.filter(
          (match) => new Date(match.startAt) > new Date()
        );
      } else if (filter === "completed") {
        filteredMatches = response.data.filter(
          (match) => match.status === "completed"
        );
      }

      setMatches(filteredMatches);
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchResult = (match) => {
    if (match.status !== "completed") return null;

    const isHome = match.homeTeam.id === user?.teamId;
    const ourScore = isHome ? match.homeScore : match.awayScore;
    const theirScore = isHome ? match.awayScore : match.homeScore;

    if (ourScore > theirScore) return "Victoire";
    if (ourScore < theirScore) return "Défaite";
    return "Nul";
  };

  const getResultStyle = (result) => {
    switch (result) {
      case "Victoire":
        return { backgroundColor: "#d1fae5", color: "#065f46" };
      case "Défaite":
        return { backgroundColor: "#fee2e2", color: "#dc2626" };
      case "Nul":
        return { backgroundColor: "#fef3c7", color: "#92400e" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Chargement des matchs...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Historique des Matchs</h1>
        <p style={styles.subtitle}>Tous les matchs de votre équipe</p>
      </div>

      {/* Filtres */}
      <div style={styles.filters}>
        <button
          onClick={() => setFilter("all")}
          style={{
            ...styles.filterButton,
            ...(filter === "all" ? styles.activeFilter : {}),
          }}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          style={{
            ...styles.filterButton,
            ...(filter === "upcoming" ? styles.activeFilter : {}),
          }}
        >
          À venir
        </button>
        <button
          onClick={() => setFilter("completed")}
          style={{
            ...styles.filterButton,
            ...(filter === "completed" ? styles.activeFilter : {}),
          }}
        >
          Terminés
        </button>
      </div>

      {/* Liste des matchs */}
      <div style={styles.matchesList}>
        {matches.map((match) => {
          const isHome = match.homeTeam.id === user?.teamId;
          const opponent = isHome ? match.awayTeam : match.homeTeam;
          const result = getMatchResult(match);

          return (
            <div key={match.id} style={styles.matchCard}>
              <div style={styles.matchHeader}>
                <div style={styles.matchDate}>
                  <Calendar size={16} />
                  {new Date(match.startAt).toLocaleDateString("fr-FR")}
                </div>
                <div style={styles.matchTime}>
                  <Clock size={16} />
                  {new Date(match.startAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div style={styles.matchContent}>
                <div style={styles.teams}>
                  <div style={styles.team}>
                    <span style={styles.teamName}>{match.homeTeam.name}</span>
                    {isHome && (
                      <span style={styles.homeIndicator}>Domicile</span>
                    )}
                  </div>

                  <div style={styles.score}>
                    {match.status === "completed" ? (
                      <span>
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span>vs</span>
                    )}
                  </div>

                  <div style={styles.team}>
                    <span style={styles.teamName}>{match.awayTeam.name}</span>
                    {!isHome && (
                      <span style={styles.awayIndicator}>Extérieur</span>
                    )}
                  </div>
                </div>

                {result && (
                  <div
                    style={{
                      ...styles.result,
                      ...getResultStyle(result),
                    }}
                  >
                    {result}
                  </div>
                )}
              </div>

              {match.venue && (
                <div style={styles.matchFooter}>
                  <MapPin size={14} />
                  <span>{match.venue}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {matches.length === 0 && (
        <div style={styles.emptyState}>
          <p>Aucun match trouvé pour cette période</p>
        </div>
      )}
    </div>
  );
};

export { TeamMatches };
