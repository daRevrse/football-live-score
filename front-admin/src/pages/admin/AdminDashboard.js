import React, { useState, useEffect } from "react";
import {
  getUsers,
  getTeams,
  getMatches,
  getLeaderboard,
} from "../../services/api";
import {
  Users,
  Shield,
  Calendar,
  Trophy,
  TrendingUp,
  Activity,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import socket from "../../services/socket";
import { styles } from "../../styles/common";
// import { styles } from './styles';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalMatches: 0,
    liveMatches: 0,
    recentActivities: [],
    usersByRole: {},
    matchesThisWeek: 0,
    completedMatches: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();

    // Socket pour les mises à jour temps réel
    socket.on("matchStarted", loadDashboardData);
    socket.on("matchFinished", loadDashboardData);
    socket.on("userCreated", loadDashboardData);
    socket.on("teamCreated", loadDashboardData);

    return () => {
      socket.off("matchStarted");
      socket.off("matchFinished");
      socket.off("userCreated");
      socket.off("teamCreated");
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersRes, teamsRes, matchesRes, leaderboardRes] =
        await Promise.all([
          getUsers(),
          getTeams(),
          getMatches(),
          getLeaderboard(),
        ]);

      const users = usersRes.data || [];
      const teams = teamsRes.data || [];
      const matches = matchesRes.data || [];

      // Calculs des statistiques
      const usersByRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      const liveMatches = matches.filter((match) =>
        ["live", "first_half", "second_half", "paused"].includes(match.status)
      ).length;

      const completedMatches = matches.filter(
        (match) => match.status === "completed"
      ).length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const matchesThisWeek = matches.filter(
        (match) => new Date(match.startAt) >= oneWeekAgo
      ).length;

      setStats({
        totalUsers: users.length,
        totalTeams: teams.length,
        totalMatches: matches.length,
        completedMatches,
        liveMatches,
        usersByRole,
        matchesThisWeek,
        recentActivities: generateRecentActivities(matches, users, teams),
      });

      setLeaderboard(leaderboardRes.slice(0, 5));
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard admin:", error);
      setError("Impossible de charger les données du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (matches, users, teams) => {
    const activities = [];

    // Matchs récents (dernières 24h)
    const recentMatches = matches
      .filter((match) => {
        const matchDate = new Date(match.startAt);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return matchDate >= oneDayAgo;
      })
      .slice(0, 3);

    recentMatches.forEach((match) => {
      let message = "";
      if (match.status === "completed") {
        message = `Match terminé: ${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name}`;
      } else if (["live", "first_half", "second_half"].includes(match.status)) {
        message = `Match en cours: ${match.homeTeam.name} vs ${match.awayTeam.name}`;
      } else {
        message = `Match programmé: ${match.homeTeam.name} vs ${match.awayTeam.name}`;
      }

      activities.push({
        id: `match-${match.id}`,
        type: "match",
        message,
        time: match.startAt,
        status: match.status,
      });
    });

    // Utilisateurs récents (dernières 24h)
    const recentUsers = users
      .filter((user) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return userDate >= oneDayAgo;
      })
      .slice(0, 2);

    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: "user",
        message: `Nouvel utilisateur: ${user.username} (${user.role})`,
        time: user.createdAt,
        status: "new",
      });
    });

    // Équipes récentes (dernières 48h)
    const recentTeams = teams
      .filter((team) => {
        if (!team.createdAt) return false;
        const teamDate = new Date(team.createdAt);
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        return teamDate >= twoDaysAgo;
      })
      .slice(0, 2);

    recentTeams.forEach((team) => {
      activities.push({
        id: `team-${team.id}`,
        type: "team",
        message: `Nouvelle équipe: ${team.name}`,
        time: team.createdAt,
        status: "new",
      });
    });

    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);
  };

  const getTeamLogo = (team) => {
    if (team?.logo) {
      return `${
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      }/uploads/${team.logo}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="animate-spin" size={24} />
        <div>Chargement du tableau de bord administrateur...</div>
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
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tableau de Bord Administrateur</h1>
        <p style={styles.subtitle}>Vue d'ensemble de la plateforme</p>
        <button onClick={loadDashboardData} style={styles.refreshButton}>
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* Métriques principales */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Users size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats.totalUsers}</div>
            <div style={styles.metricLabel}>Utilisateurs</div>
            <div style={styles.metricSubtext}>
              {stats.usersByRole.Admin || 0} Admin •{" "}
              {stats.usersByRole.Manager || 0} Manager •{" "}
              {stats.usersByRole.Reporter || 0} Reporter
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Shield size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats.totalTeams}</div>
            <div style={styles.metricLabel}>Équipes</div>
            <div style={styles.metricSubtext}>
              {stats.usersByRole.Manager || 0} avec manager
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Calendar size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats.totalMatches}</div>
            <div style={styles.metricLabel}>Matchs</div>
            <div style={styles.metricSubtext}>
              {stats.completedMatches} terminés • {stats.matchesThisWeek} cette
              semaine
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Activity size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats.liveMatches}</div>
            <div style={styles.metricLabel}>Matchs en cours</div>
            <div style={styles.metricSubtext}>
              {stats.liveMatches > 0 ? "En temps réel" : "Aucun match actif"}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        {/* Classement avec logos */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Trophy size={20} />
              Classement
            </h2>
          </div>
          <div style={styles.leaderboard}>
            {leaderboard.length > 0 ? (
              leaderboard.map((team, index) => (
                <div key={team.id} style={styles.leaderboardItem}>
                  <div style={styles.position}>#{index + 1}</div>
                  <div style={styles.teamSection}>
                    {team.logo && (
                      <img
                        src={getTeamLogo(team)}
                        alt={`${team.name} logo`}
                        style={styles.teamLogoSmall}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div style={styles.teamInfo}>
                      <div style={styles.teamName}>{team.name}</div>
                      <div style={styles.teamStats}>
                        {team.stats?.played || 0} matchs •{" "}
                        {team.stats?.wins || 0}V {team.stats?.draws || 0}N{" "}
                        {team.stats?.losses || 0}D
                      </div>
                    </div>
                  </div>
                  <div style={styles.teamPoints}>
                    <div style={styles.points}>{team.stats?.points || 0}</div>
                    <div style={styles.goalDiff}>
                      {team.stats?.goalDifference > 0 ? "+" : ""}
                      {team.stats?.goalDifference || 0}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <p>Aucun classement disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Activités récentes */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <TrendingUp size={20} />
              Activités Récentes
            </h2>
          </div>
          <div style={styles.activitiesList}>
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={styles.activityIcon}>
                    {activity.type === "match" ? (
                      <Calendar size={16} />
                    ) : activity.type === "user" ? (
                      <Users size={16} />
                    ) : (
                      <Shield size={16} />
                    )}
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityMessage}>{activity.message}</div>
                    <div style={styles.activityTime}>
                      {new Date(activity.time).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(activity.time).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={styles.activityStatus}>
                    {activity.status === "live" && (
                      <span style={styles.statusLive}>Live</span>
                    )}
                    {activity.status === "completed" && (
                      <span style={styles.statusCompleted}>Terminé</span>
                    )}
                    {activity.status === "new" && (
                      <span style={styles.statusNew}>Nouveau</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noActivities}>
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Répartition des utilisateurs */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <BarChart3 size={20} />
              Utilisateurs par Rôle
            </h2>
          </div>
          <div style={styles.roleStats}>
            {Object.entries(stats.usersByRole).length > 0 ? (
              Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} style={styles.roleItem}>
                  <div style={styles.roleLabel}>{role}</div>
                  <div style={styles.roleCount}>{count}</div>
                  <div style={styles.roleBar}>
                    <div
                      style={{
                        ...styles.roleBarFill,
                        width: `${
                          stats.totalUsers > 0
                            ? (count / stats.totalUsers) * 100
                            : 0
                        }%`,
                        backgroundColor: getRoleColor(role),
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <p>Aucun utilisateur enregistré</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertes système */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <AlertCircle size={20} />
              Alertes Système
            </h2>
          </div>
          <div style={styles.alertsList}>
            {stats.liveMatches === 0 && stats.totalMatches > 0 && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#f59e0b" }} />
                <span>Aucun match en cours actuellement</span>
              </div>
            )}
            {(stats.usersByRole.Reporter === 0 ||
              !stats.usersByRole.Reporter) && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#ef4444" }} />
                <span>Aucun reporter assigné</span>
              </div>
            )}
            {stats.totalTeams < 4 && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#f59e0b" }} />
                <span>
                  Nombre d'équipes insuffisant pour un championnat complet (
                  {stats.totalTeams}/4 minimum)
                </span>
              </div>
            )}
            {stats.totalUsers === 0 && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#ef4444" }} />
                <span>Aucun utilisateur enregistré</span>
              </div>
            )}
            {stats.liveMatches === 0 &&
              stats.totalTeams >= 4 &&
              stats.usersByRole.Reporter > 0 &&
              stats.totalUsers > 0 && (
                <div style={styles.noAlerts}>
                  <p>✅ Système opérationnel - Aucune alerte</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getRoleColor = (role) => {
  switch (role) {
    case "Admin":
      return "#dc2626";
    case "Manager":
      return "#3b82f6";
    case "Reporter":
      return "#16a34a";
    case "User":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

export { AdminDashboard };
