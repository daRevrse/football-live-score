// ==================== REPORTER DASHBOARD ====================
// front-admin/src/pages/reporter/ReporterDashboard.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMatches } from "../../services/api";
import { Calendar, Clock, Play, CheckCircle, AlertCircle } from "lucide-react";
import { styles } from "./styles";

const ReporterDashboard = () => {
  const { user } = useAuth();
  const [assignedMatches, setAssignedMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger tous les matchs assignés au reporter
      const response = await getMatches({
        reporterId: user?.id,
      });

      const matches = response.data;
      setAssignedMatches(matches);

      // Filtrer les matchs d'aujourd'hui
      const today = new Date().toDateString();
      const todayMatches = matches.filter(
        (match) => new Date(match.startAt).toDateString() === today
      );
      setTodayMatches(todayMatches);

      // Filtrer les matchs en cours
      const liveMatches = matches.filter(
        (match) =>
          match.status === "live" ||
          match.status === "first_half" ||
          match.status === "second_half"
      );
      setLiveMatches(liveMatches);
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tableau de Bord Reporter</h1>
        <p style={styles.subtitle}>
          Bonjour {user?.username}, voici vos matchs assignés
        </p>
      </div>

      {/* Métriques rapides */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Calendar size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{assignedMatches.length}</div>
            <div style={styles.metricLabel}>Matchs assignés</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Clock size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{todayMatches.length}</div>
            <div style={styles.metricLabel}>Matchs aujourd'hui</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Play size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{liveMatches.length}</div>
            <div style={styles.metricLabel}>Matchs en cours</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <CheckCircle size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>
              {assignedMatches.filter((m) => m.status === "completed").length}
            </div>
            <div style={styles.metricLabel}>Matchs complétés</div>
          </div>
        </div>
      </div>

      {/* Matchs en cours */}
      {liveMatches.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Matchs en Direct</h2>
          <div style={styles.matchesList}>
            {liveMatches.map((match) => (
              <div key={match.id} style={styles.liveMatchCard}>
                <div style={styles.liveIndicator}>
                  <div style={styles.liveDot}></div>
                  LIVE
                </div>
                <div style={styles.matchInfo}>
                  <div style={styles.teams}>
                    <span>{match.homeTeam.name}</span>
                    <span style={styles.score}>
                      {match.homeScore} - {match.awayScore}
                    </span>
                    <span>{match.awayTeam.name}</span>
                  </div>
                  <div style={styles.matchTime}>{match.currentMinute}'</div>
                </div>
                <button style={styles.actionButton}>
                  Gérer les événements
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matchs d'aujourd'hui */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Matchs d'Aujourd'hui</h2>
        {todayMatches.length > 0 ? (
          <div style={styles.matchesList}>
            {todayMatches.map((match) => (
              <div key={match.id} style={styles.matchCard}>
                <div style={styles.matchHeader}>
                  <div style={styles.matchTime}>
                    <Clock size={16} />
                    {new Date(match.startAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div style={styles.matchStatus}>
                    {match.status === "scheduled" && (
                      <span style={styles.statusScheduled}>Programmé</span>
                    )}
                    {match.status === "live" && (
                      <span style={styles.statusLive}>En cours</span>
                    )}
                    {match.status === "completed" && (
                      <span style={styles.statusCompleted}>Terminé</span>
                    )}
                  </div>
                </div>
                <div style={styles.matchContent}>
                  <div style={styles.teams}>
                    <span>{match.homeTeam.name}</span>
                    <span style={styles.vs}>vs</span>
                    <span>{match.awayTeam.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p>Aucun match assigné aujourd'hui</p>
          </div>
        )}
      </div>

      {/* Prochains matchs */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Prochains Matchs</h2>
        <div style={styles.upcomingMatches}>
          {assignedMatches
            .filter(
              (match) =>
                new Date(match.startAt) > new Date() &&
                new Date(match.startAt).toDateString() !==
                  new Date().toDateString()
            )
            .slice(0, 5)
            .map((match) => (
              <div key={match.id} style={styles.upcomingMatch}>
                <div style={styles.upcomingDate}>
                  {new Date(match.startAt).toLocaleDateString("fr-FR")}
                </div>
                <div style={styles.upcomingTeams}>
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </div>
                <div style={styles.upcomingTime}>
                  {new Date(match.startAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export { ReporterDashboard };
