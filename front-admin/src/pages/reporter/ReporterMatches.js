// ==================== REPORTER MATCHES PAGE ====================
// front-admin/src/pages/reporter/ReporterMatches.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMatches } from "../../services/api";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  AlertCircle,
} from "lucide-react";
import { styles } from "./styles";

const ReporterMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, live, completed

  useEffect(() => {
    loadMatches();
  }, [filter]);

  const loadMatches = async () => {
    try {
      const response = await getMatches({
        reporterId: user?.id,
      });

      let filteredMatches = response.data;

      switch (filter) {
        case "upcoming":
          filteredMatches = response.data.filter(
            (match) =>
              new Date(match.startAt) > new Date() &&
              match.status === "scheduled"
          );
          break;
        case "live":
          filteredMatches = response.data.filter(
            (match) =>
              match.status === "live" ||
              match.status === "first_half" ||
              match.status === "second_half"
          );
          break;
        case "completed":
          filteredMatches = response.data.filter(
            (match) => match.status === "completed"
          );
          break;
        default:
          break;
      }

      setMatches(
        filteredMatches.sort(
          (a, b) => new Date(b.startAt) - new Date(a.startAt)
        )
      );
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "scheduled":
        return { backgroundColor: "#e0f2fe", color: "#0369a1" };
      case "live":
      case "first_half":
      case "second_half":
        return { backgroundColor: "#dcfce7", color: "#16a34a" };
      case "completed":
        return { backgroundColor: "#f3f4f6", color: "#6b7280" };
      default:
        return { backgroundColor: "#fef3c7", color: "#92400e" };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "Programmé";
      case "live":
        return "En cours";
      case "first_half":
        return "1ère mi-temps";
      case "second_half":
        return "2ème mi-temps";
      case "completed":
        return "Terminé";
      default:
        return status;
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
        <h1 style={styles.title}>Mes Matchs Assignés</h1>
        <p style={styles.subtitle}>
          Gestion de vos matchs en tant que reporter
        </p>
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
          Tous ({matches.length})
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
          onClick={() => setFilter("live")}
          style={{
            ...styles.filterButton,
            ...(filter === "live" ? styles.activeFilter : {}),
          }}
        >
          En direct
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
        {matches.map((match) => (
          <div key={match.id} style={styles.matchCard}>
            <div style={styles.matchHeader}>
              <div style={styles.matchDate}>
                <Calendar size={16} />
                {new Date(match.startAt).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div
                style={{
                  ...styles.status,
                  ...getStatusStyle(match.status),
                }}
              >
                {getStatusText(match.status)}
              </div>
            </div>

            <div style={styles.matchContent}>
              <div style={styles.teams}>
                <div style={styles.team}>
                  <span style={styles.teamName}>{match.homeTeam.name}</span>
                  <span style={styles.homeIndicator}>Domicile</span>
                </div>

                <div style={styles.scoreSection}>
                  {match.status === "completed" ? (
                    <div style={styles.finalScore}>
                      {match.homeScore} - {match.awayScore}
                    </div>
                  ) : match.status === "live" ||
                    match.status === "first_half" ||
                    match.status === "second_half" ? (
                    <div style={styles.liveScore}>
                      <div>
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <div style={styles.minute}>{match.currentMinute}'</div>
                    </div>
                  ) : (
                    <div style={styles.time}>
                      <Clock size={16} />
                      {new Date(match.startAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>

                <div style={styles.team}>
                  <span style={styles.teamName}>{match.awayTeam.name}</span>
                  <span style={styles.awayIndicator}>Extérieur</span>
                </div>
              </div>

              {match.venue && (
                <div style={styles.venue}>
                  <MapPin size={14} />
                  <span>{match.venue}</span>
                </div>
              )}
            </div>

            <div style={styles.matchActions}>
              {(match.status === "live" ||
                match.status === "first_half" ||
                match.status === "second_half") && (
                <button style={styles.liveActionButton}>
                  <Users size={16} />
                  Gérer les événements
                </button>
              )}

              {match.status === "scheduled" && (
                <button style={styles.actionButton}>
                  <FileText size={16} />
                  Préparer le match
                </button>
              )}

              {match.status === "completed" && (
                <button style={styles.actionButton}>
                  <FileText size={16} />
                  Voir le rapport
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div style={styles.emptyState}>
          <AlertCircle size={48} style={styles.emptyIcon} />
          <h3>Aucun match trouvé</h3>
          <p>Aucun match assigné pour cette période</p>
        </div>
      )}
    </div>
  );
};

export { ReporterMatches };
