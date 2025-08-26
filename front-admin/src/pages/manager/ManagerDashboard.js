import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getTeamStats,
  getTeamPlayers,
  getTeamMatches,
  getMatches,
  getTeam,
} from "../../services/api";
import {
  Users,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import socket from "../../services/socket";
import { styles } from "../../styles/common";
// import { styles } from './styles';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    team: null,
    stats: null,
    players: [],
    recentMatches: [],
    upcomingMatches: [],
    liveMatches: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.teamId) {
      loadDashboardData();

      // Socket pour les mises à jour en temps réel
      socket.on("matchUpdated", handleMatchUpdate);
      socket.on("matchStarted", handleMatchUpdate);
      socket.on("matchFinished", handleMatchUpdate);

      return () => {
        socket.off("matchUpdated");
        socket.off("matchStarted");
        socket.off("matchFinished");
      };
    }
  }, [user?.teamId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [teamResponse, statsResponse, playersResponse, allMatchesResponse] =
        await Promise.all([
          getTeam(user.teamId),
          getTeamStats(user.teamId),
          getTeamPlayers(user.teamId),
          getMatches({ teamId: user.teamId }),
        ]);

      const matches = allMatchesResponse.data || [];

      // Filtrer les matchs
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentMatches = matches
        .filter(
          (match) =>
            match.status === "completed" &&
            new Date(match.startAt) >= oneWeekAgo
        )
        .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
        .slice(0, 5);

      const upcomingMatches = matches
        .filter(
          (match) =>
            match.status === "scheduled" && new Date(match.startAt) > now
        )
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
        .slice(0, 3);

      const liveMatches = matches.filter((match) =>
        ["live", "first_half", "second_half", "paused"].includes(match.status)
      );

      setDashboardData({
        team: teamResponse.data,
        stats: statsResponse.data,
        players: playersResponse.data.players || [],
        recentMatches,
        upcomingMatches,
        liveMatches,
      });

      console.log("Data loaded", {
        team: teamResponse.data,
        stats: statsResponse.data,
        players: playersResponse.data.players,
        recentMatches,
        upcomingMatches,
        liveMatches,
      });
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
      setError("Impossible de charger les données du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  const handleMatchUpdate = (updatedMatch) => {
    // Vérifier si le match concerne notre équipe
    if (
      updatedMatch.homeTeam.id === user.teamId ||
      updatedMatch.awayTeam.id === user.teamId
    ) {
      loadDashboardData(); // Recharger les données
    }
  };

  const getTeamLogo = (team) => {
    if (team?.logo) {
      return `${
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      }/uploads/${team.logo}`;
    }
    return null;
  };

  const getMatchResult = (match) => {
    if (match.status !== "completed") return null;

    const isHome = match.homeTeam.id === user?.teamId;
    const ourScore = isHome ? match.homeScore : match.awayScore;
    const theirScore = isHome ? match.awayScore : match.homeScore;

    if (ourScore > theirScore) return "W";
    if (ourScore < theirScore) return "L";
    return "D";
  };

  const getResultStyle = (result) => {
    switch (result) {
      case "W":
        return { backgroundColor: "#dcfce7", color: "#16a34a" };
      case "L":
        return { backgroundColor: "#fee2e2", color: "#dc2626" };
      case "D":
        return { backgroundColor: "#fef3c7", color: "#92400e" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Chargement du tableau de bord...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} />
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} style={styles.retryButton}>
          Réessayer
        </button>
      </div>
    );
  }

  const { team, stats, players, recentMatches, upcomingMatches, liveMatches } =
    dashboardData;

  return (
    <div style={styles.container}>
      {/* Header avec logo de l'équipe */}
      <div style={styles.header}>
        <div style={styles.teamHeader}>
          {team?.logo && (
            <img
              src={getTeamLogo(team)}
              alt={`${team.name} logo`}
              style={styles.teamLogo}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div>
            <h1 style={styles.title}>Tableau de Bord - {team?.name}</h1>
            <p style={styles.subtitle}>Manager: {user?.username}</p>
          </div>
        </div>
      </div>

      {/* Alerte matchs en cours */}
      {liveMatches.length > 0 && (
        <div style={styles.liveAlert}>
          <div style={styles.liveIndicator}>
            <div style={styles.liveDot}></div>
            MATCH EN COURS
          </div>
          {liveMatches.map((match) => (
            <div key={match.id} style={styles.liveMatchInfo}>
              <span>
                {match.homeTeam.name} {match.homeScore} - {match.awayScore}{" "}
                {match.awayTeam.name}
              </span>
              <span>{match.currentMinute}'</span>
            </div>
          ))}
        </div>
      )}

      {/* Métriques principales */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Trophy size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats?.points || 0}</div>
            <div style={styles.metricLabel}>Points</div>
            <div style={styles.metricSubtext}>
              Classement: {stats?.position || "N/A"}
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Target size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats?.goals || 0}</div>
            <div style={styles.metricLabel}>Buts marqués</div>
            <div style={styles.metricSubtext}>
              Encaissés: {stats?.goalsAgainst || 0}
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Users size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{players.length}</div>
            <div style={styles.metricLabel}>Joueurs</div>
            <div style={styles.metricSubtext}>
              Actifs: {players.filter((p) => p.status === "active").length}
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <TrendingUp size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>
              {stats?.wins || 0}/{stats?.played || 0}
            </div>
            <div style={styles.metricLabel}>Victoires</div>
            <div style={styles.metricSubtext}>
              {stats?.played
                ? Math.round((stats.wins / stats.played) * 100)
                : 0}
              %
            </div>
          </div>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        {/* Matchs récents */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Calendar size={20} />
            Derniers Résultats
          </h2>
          <div style={styles.matchesList}>
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => {
                const result = getMatchResult(match);
                const isHome = match.homeTeam.id === user.teamId;
                const opponent = isHome ? match.awayTeam : match.homeTeam;

                return (
                  <div key={match.id} style={styles.matchItem}>
                    <div style={styles.matchDate}>
                      {new Date(match.startAt).toLocaleDateString("fr-FR")}
                    </div>
                    <div style={styles.matchTeams}>
                      <span>
                        {isHome ? "vs" : "@"} {opponent.name}
                      </span>
                    </div>
                    <div style={styles.matchScore}>
                      {match.homeScore} - {match.awayScore}
                    </div>
                    <div
                      style={{
                        ...styles.matchResult,
                        ...getResultStyle(result),
                      }}
                    >
                      {result}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>
                <p>Aucun match récent</p>
              </div>
            )}
          </div>
        </div>

        {/* Prochains matchs */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Clock size={20} />
            Prochains Matchs
          </h2>
          <div style={styles.upcomingList}>
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => {
                const isHome = match.homeTeam.id === user.teamId;
                const opponent = isHome ? match.awayTeam : match.homeTeam;

                return (
                  <div key={match.id} style={styles.upcomingMatch}>
                    <div style={styles.upcomingDate}>
                      <div>
                        {new Date(match.startAt).toLocaleDateString("fr-FR")}
                      </div>
                      <div style={styles.upcomingTime}>
                        {new Date(match.startAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div style={styles.upcomingOpponent}>
                      <span>{isHome ? "vs" : "@"}</span>
                      <span style={styles.opponentName}>{opponent.name}</span>
                    </div>
                    <div style={styles.upcomingVenue}>
                      {isHome
                        ? team?.stadium || "Domicile"
                        : opponent.stadium || "Extérieur"}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>
                <p>Aucun match programmé</p>
              </div>
            )}
          </div>
        </div>

        {/* Top joueurs */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Users size={20} />
            Effectif
          </h2>
          <div style={styles.playersList}>
            {players.slice(0, 8).map((player) => (
              <div key={player.id} style={styles.playerItem}>
                <div style={styles.playerNumber}>
                  {player.jerseyNumber || "#"}
                </div>
                <div style={styles.playerInfo}>
                  <div style={styles.playerName}>{player.name}</div>
                  <div style={styles.playerPosition}>{player.position}</div>
                </div>
                <div style={styles.playerStats}>
                  <span>{player.goals || 0} buts</span>
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <div style={styles.emptyState}>
                <p>Aucun joueur enregistré</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
