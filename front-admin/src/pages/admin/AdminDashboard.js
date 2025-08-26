// ==================== ADMIN DASHBOARD ====================
// front-admin/src/pages/admin/AdminDashboard.js
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
} from "lucide-react";
import { styles } from "./styles";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalMatches: 0,
    liveMatches: 0,
    recentActivities: [],
    usersByRole: {},
    matchesThisWeek: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [usersRes, teamsRes, matchesRes, leaderboardRes] =
        await Promise.all([
          getUsers(),
          getTeams(),
          getMatches(),
          getLeaderboard(),
        ]);

      const users = usersRes.data;
      const teams = teamsRes.data;
      const matches = matchesRes.data;

      // Calculs des statistiques
      const usersByRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      const liveMatches = matches.filter(
        (match) =>
          match.status === "live" ||
          match.status === "first_half" ||
          match.status === "second_half"
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
        liveMatches,
        usersByRole,
        matchesThisWeek,
        recentActivities: generateRecentActivities(matches, users),
      });

      setLeaderboard(leaderboardRes.slice(0, 5));
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (matches, users) => {
    const activities = [];

    // Matchs récents
    const recentMatches = matches
      .filter(
        (match) =>
          new Date(match.startAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
      .slice(0, 3);

    recentMatches.forEach((match) => {
      activities.push({
        id: `match-${match.id}`,
        type: "match",
        message: `Match ${match.homeTeam.name} vs ${match.awayTeam.name}`,
        time: match.startAt,
        status: match.status,
      });
    });

    // Utilisateurs récents
    const recentUsers = users
      .filter(
        (user) =>
          new Date(user.createdAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
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

    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);
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
        <h1 style={styles.title}>Tableau de Bord Administrateur</h1>
        <p style={styles.subtitle}>Vue d'ensemble de la plateforme</p>
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
              {stats.usersByRole.Admin || 0} Admin,{" "}
              {stats.usersByRole.Manager || 0} Manager
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
              {stats.matchesThisWeek} cette semaine
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
            <div style={styles.metricSubtext}>En temps réel</div>
          </div>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        {/* Classement */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Trophy size={20} />
              Classement
            </h2>
          </div>
          <div style={styles.leaderboard}>
            {leaderboard.map((team, index) => (
              <div key={team.id} style={styles.leaderboardItem}>
                <div style={styles.position}>#{index + 1}</div>
                <div style={styles.teamInfo}>
                  <div style={styles.teamName}>{team.name}</div>
                  <div style={styles.teamStats}>
                    {team.stats?.played || 0} matchs • {team.stats?.points || 0}{" "}
                    pts
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
            ))}
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
                    ) : (
                      <Users size={16} />
                    )}
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityMessage}>{activity.message}</div>
                    <div style={styles.activityTime}>
                      {new Date(activity.time).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div style={styles.activityStatus}>
                    {activity.status === "live" && (
                      <span style={styles.statusLive}>Live</span>
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
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} style={styles.roleItem}>
                <div style={styles.roleLabel}>{role}</div>
                <div style={styles.roleCount}>{count}</div>
                <div style={styles.roleBar}>
                  <div
                    style={{
                      ...styles.roleBarFill,
                      width: `${(count / stats.totalUsers) * 100}%`,
                      backgroundColor: getRoleColor(role),
                    }}
                  />
                </div>
              </div>
            ))}
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
            {stats.liveMatches === 0 && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#f59e0b" }} />
                <span>Aucun match en cours actuellement</span>
              </div>
            )}
            {stats.usersByRole.Reporter === 0 && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#ef4444" }} />
                <span>Aucun reporter assigné</span>
              </div>
            )}
            {stats.totalTeams < 4 && (
              <div style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: "#f59e0b" }} />
                <span>Nombre d'équipes insuffisant pour un championnat</span>
              </div>
            )}
            {Object.keys(stats.usersByRole).length === 0 && (
              <div style={styles.noAlerts}>
                <p>Aucune alerte système</p>
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
