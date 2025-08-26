// ==================== ADMIN REPORTS PAGE ====================
// front-admin/src/pages/admin/AdminReports.js
import React, { useState, useEffect } from "react";
import { getUsers, getTeams, getMatches } from "../../services/api";
import {
  Download,
  Filter,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { styles } from "./styles";

const AdminReports = () => {
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes, matchesRes] = await Promise.all([
        getUsers(),
        getTeams(),
        getMatches(),
      ]);

      const users = usersRes.data;
      const teams = teamsRes.data;
      const matches = matchesRes.data;

      // Filtrer par période
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setFullYear(2000); // Toutes les données
      }

      const filteredMatches = matches.filter(
        (match) => new Date(match.startAt) >= startDate
      );

      const reportData = generateReportData(
        users,
        teams,
        filteredMatches,
        reportType
      );
      setData(reportData);
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = (users, teams, matches, type) => {
    switch (type) {
      case "overview":
        return {
          summary: {
            totalUsers: users.length,
            totalTeams: teams.length,
            totalMatches: matches.length,
            completedMatches: matches.filter((m) => m.status === "completed")
              .length,
          },
          usersByRole: users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {}),
          matchesStatus: matches.reduce((acc, match) => {
            acc[match.status] = (acc[match.status] || 0) + 1;
            return acc;
          }, {}),
          teamsStats: teams.map((team) => ({
            name: team.name,
            matchesPlayed: matches.filter(
              (m) => m.homeTeam.id === team.id || m.awayTeam.id === team.id
            ).length,
          })),
        };

      case "matches":
        return {
          totalMatches: matches.length,
          byStatus: matches.reduce((acc, match) => {
            acc[match.status] = (acc[match.status] || 0) + 1;
            return acc;
          }, {}),
          byMonth: getMatchesByMonth(matches),
          topScoring: getTopScoringMatches(matches),
          averageGoals: getAverageGoals(matches),
        };

      case "teams":
        return {
          totalTeams: teams.length,
          teamsWithManager: teams.filter((team) =>
            users.some(
              (user) => user.teamId === team.id && user.role === "Manager"
            )
          ).length,
          teamStats: teams.map((team) => {
            const teamMatches = matches.filter(
              (m) => m.homeTeam.id === team.id || m.awayTeam.id === team.id
            );
            return {
              name: team.name,
              matches: teamMatches.length,
              goals: getTeamGoals(team, teamMatches),
              hasManager: users.some(
                (user) => user.teamId === team.id && user.role === "Manager"
              ),
            };
          }),
        };

      default:
        return {};
    }
  };

  const getMatchesByMonth = (matches) => {
    const monthNames = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const byMonth = {};

    matches.forEach((match) => {
      const month = monthNames[new Date(match.startAt).getMonth()];
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return byMonth;
  };

  const getTopScoringMatches = (matches) => {
    return matches
      .filter((m) => m.status === "completed")
      .map((match) => ({
        ...match,
        totalGoals: (match.homeScore || 0) + (match.awayScore || 0),
      }))
      .sort((a, b) => b.totalGoals - a.totalGoals)
      .slice(0, 5);
  };

  const getAverageGoals = (matches) => {
    const completedMatches = matches.filter((m) => m.status === "completed");
    if (completedMatches.length === 0) return 0;

    const totalGoals = completedMatches.reduce(
      (sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0),
      0
    );

    return (totalGoals / completedMatches.length).toFixed(2);
  };

  const getTeamGoals = (team, matches) => {
    return matches
      .filter((m) => m.status === "completed")
      .reduce((total, match) => {
        if (match.homeTeam.id === team.id) {
          return total + (match.homeScore || 0);
        } else if (match.awayTeam.id === team.id) {
          return total + (match.awayScore || 0);
        }
        return total;
      }, 0);
  };

  const exportReport = () => {
    if (!data) return;

    const reportContent = JSON.stringify(data, null, 2);
    const blob = new Blob([reportContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${reportType}-${dateRange}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Rapports et Analyses</h1>
        <p style={styles.subtitle}>Statistiques détaillées de la plateforme</p>
      </div>

      {/* Filtres */}
      <div style={styles.filtersSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Type de rapport</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={styles.select}
          >
            <option value="overview">Vue d'ensemble</option>
            <option value="matches">Matchs</option>
            <option value="teams">Équipes</option>
            <option value="users">Utilisateurs</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Période</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={styles.select}
          >
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">12 derniers mois</option>
            <option value="all">Toutes les données</option>
          </select>
        </div>

        <button
          onClick={exportReport}
          style={styles.exportButton}
          disabled={!data}
        >
          <Download size={16} />
          Exporter
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div>Génération du rapport...</div>
        </div>
      ) : data ? (
        <div style={styles.reportContent}>
          {reportType === "overview" && <OverviewReport data={data} />}
          {reportType === "matches" && <MatchesReport data={data} />}
          {reportType === "teams" && <TeamsReport data={data} />}
        </div>
      ) : null}
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

// Composants de rapports
const OverviewReport = ({ data }) => (
  <div style={styles.reportGrid}>
    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Résumé Général</h3>
      <div style={styles.summaryGrid}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{data.summary.totalUsers}</div>
          <div style={styles.summaryLabel}>Utilisateurs</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{data.summary.totalTeams}</div>
          <div style={styles.summaryLabel}>Équipes</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{data.summary.totalMatches}</div>
          <div style={styles.summaryLabel}>Matchs</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{data.summary.completedMatches}</div>
          <div style={styles.summaryLabel}>Terminés</div>
        </div>
      </div>
    </div>

    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Utilisateurs par Rôle</h3>
      <div style={styles.chartContainer}>
        {Object.entries(data.usersByRole).map(([role, count]) => (
          <div key={role} style={styles.barItem}>
            <div style={styles.barLabel}>{role}</div>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  width: `${(count / data.summary.totalUsers) * 100}%`,
                  backgroundColor: getRoleColor(role),
                }}
              />
            </div>
            <div style={styles.barValue}>{count}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Statut des Matchs</h3>
      <div style={styles.statusList}>
        {Object.entries(data.matchesStatus).map(([status, count]) => (
          <div key={status} style={styles.statusItem}>
            <span style={styles.statusLabel}>{getStatusLabel(status)}</span>
            <span style={styles.statusCount}>{count}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Activité des Équipes</h3>
      <div style={styles.teamsList}>
        {data.teamsStats.map((team) => (
          <div key={team.name} style={styles.teamItem}>
            <span style={styles.teamName}>{team.name}</span>
            <span style={styles.teamMatches}>{team.matchesPlayed} matchs</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MatchesReport = ({ data }) => (
  <div style={styles.reportGrid}>
    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Statistiques Générales</h3>
      <div style={styles.statsList}>
        <div style={styles.statItem}>
          <span>Total des matchs</span>
          <span style={styles.statValue}>{data.totalMatches}</span>
        </div>
        <div style={styles.statItem}>
          <span>Moyenne de buts par match</span>
          <span style={styles.statValue}>{data.averageGoals}</span>
        </div>
      </div>
    </div>

    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Matchs par Mois</h3>
      <div style={styles.monthlyChart}>
        {Object.entries(data.byMonth).map(([month, count]) => (
          <div key={month} style={styles.monthItem}>
            <div style={styles.monthLabel}>{month}</div>
            <div style={styles.monthBar}>
              <div
                style={{
                  ...styles.monthBarFill,
                  height: `${
                    (count / Math.max(...Object.values(data.byMonth))) * 100
                  }%`,
                }}
              />
            </div>
            <div style={styles.monthValue}>{count}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Matchs les plus Prolifiques</h3>
      <div style={styles.topMatches}>
        {data.topScoring.map((match, index) => (
          <div key={match.id} style={styles.matchRow}>
            <div style={styles.matchRank}>#{index + 1}</div>
            <div style={styles.matchDetails}>
              <div style={styles.matchTeams}>
                {match.homeTeam.name} vs {match.awayTeam.name}
              </div>
              <div style={styles.matchScore}>
                {match.homeScore} - {match.awayScore}
              </div>
            </div>
            <div style={styles.matchGoals}>{match.totalGoals} buts</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TeamsReport = ({ data }) => (
  <div style={styles.reportGrid}>
    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Vue d'ensemble</h3>
      <div style={styles.statsList}>
        <div style={styles.statItem}>
          <span>Total équipes</span>
          <span style={styles.statValue}>{data.totalTeams}</span>
        </div>
        <div style={styles.statItem}>
          <span>Avec manager</span>
          <span style={styles.statValue}>{data.teamsWithManager}</span>
        </div>
        <div style={styles.statItem}>
          <span>Taux de gestion</span>
          <span style={styles.statValue}>
            {Math.round((data.teamsWithManager / data.totalTeams) * 100)}%
          </span>
        </div>
      </div>
    </div>

    <div style={styles.reportCard}>
      <h3 style={styles.cardTitle}>Statistiques des Équipes</h3>
      <div style={styles.teamsTable}>
        <div style={styles.tableHeader}>
          <div>Équipe</div>
          <div>Matchs</div>
          <div>Buts</div>
          <div>Manager</div>
        </div>
        {data.teamStats.map((team) => (
          <div key={team.name} style={styles.tableRow}>
            <div style={styles.teamName}>{team.name}</div>
            <div>{team.matches}</div>
            <div>{team.goals}</div>
            <div>
              {team.hasManager ? (
                <span style={styles.hasManager}>✓</span>
              ) : (
                <span style={styles.noManager}>✗</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const getStatusLabel = (status) => {
  switch (status) {
    case "scheduled":
      return "Programmés";
    case "live":
      return "En cours";
    case "completed":
      return "Terminés";
    case "cancelled":
      return "Annulés";
    default:
      return status;
  }
};

export { AdminReports };
