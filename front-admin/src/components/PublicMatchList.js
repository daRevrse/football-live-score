import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  RefreshCw,
  Flag,
  AlertCircle,
  Flame,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { getMatches, getTeams } from "../services/api";
import socket from "../services/socket";

// Données de démonstration
// const mockMatches = [
//   {
//     id: 1,
//     homeTeamId: 1,
//     awayTeamId: 2,
//     homeScore: 2,
//     awayScore: 1,
//     status: "live",
//     startAt: new Date().toISOString(),
//     location: "Stade Municipal",
//   },
//   {
//     id: 2,
//     homeTeamId: 3,
//     awayTeamId: 4,
//     homeScore: 1,
//     awayScore: 3,
//     status: "finished",
//     startAt: new Date(Date.now() - 86400000).toISOString(),
//     location: "Complexe Sportif",
//   },
//   {
//     id: 3,
//     homeTeamId: 5,
//     awayTeamId: 6,
//     homeScore: 0,
//     awayScore: 0,
//     status: "upcoming",
//     startAt: new Date(Date.now() + 86400000).toISOString(),
//     location: "Terrain Central",
//   },
// ];

// const mockTeams = [
//   { id: 1, name: "FC Lions" },
//   { id: 2, name: "AS Eagles" },
//   { id: 3, name: "RC Tigers" },
//   { id: 4, name: "US Panthers" },
//   { id: 5, name: "AC Wolves" },
//   { id: 6, name: "SC Sharks" },
// ];

// const getMatches = () => Promise.resolve({ data: mockMatches });
// const getTeams = () => Promise.resolve({ data: { teams: mockTeams } });
// const socket = { on: () => {}, off: () => {} };

export default function PublicMatchList() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesRes, teamsRes] = await Promise.all([
          getMatches(),
          getTeams(),
        ]);

        setMatches(matchesRes.data);
        setTeams(teamsRes.data.teams);
      } catch (err) {
        setError("Erreur de chargement des données");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const onUpdated = (updatedMatch) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
    };

    socket.on("match_updated", onUpdated);
    socket.on("match_created", (newMatch) =>
      setMatches((prev) => [...prev, newMatch])
    );
    socket.on(
      "match:event",
      (payload) => payload?.match && onUpdated(payload.match)
    );

    return () => {
      socket.off("match_updated", onUpdated);
      socket.off("match_created");
      socket.off("match:event");
    };
  }, []);

  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Équipe inconnue";
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "live":
        return {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          icon: <Flame size={16} />,
          text: "En direct",
        };
      case "finished":
      case "terminé":
        return {
          backgroundColor: "#f0fdf4",
          color: "#166534",
          icon: <CheckCircle2 size={16} />,
          text: "Terminé",
        };
      default:
        return {
          backgroundColor: "#eff6ff",
          color: "#1e40af",
          icon: <Clock size={16} />,
          text: "À venir",
        };
    }
  };

  // Styles CSS intégrés
  const styles = {
    container: {
      padding: "24px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      minHeight: "100vh",
    },
    header: {
      textAlign: "center",
      marginBottom: "48px",
    },
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      margin: "0 0 8px 0",
    },
    subtitle: {
      fontSize: "18px",
      color: "#64748b",
      fontWeight: "400",
    },
    errorAlert: {
      padding: "20px",
      borderRadius: "12px",
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "24px",
      fontSize: "16px",
      fontWeight: "500",
    },
    loading: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px",
      gap: "16px",
      color: "#64748b",
    },
    loadingText: {
      fontSize: "18px",
      fontWeight: "500",
    },
    emptyState: {
      textAlign: "center",
      padding: "80px 40px",
      color: "#64748b",
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      maxWidth: "500px",
      margin: "0 auto",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "24px",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    matchCard: {
      backgroundColor: "white",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      cursor: "pointer",
    },
    matchCardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
      borderColor: "#3b82f6",
    },
    liveIndicator: {
      position: "absolute",
      top: "16px",
      right: "16px",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      background: "linear-gradient(45deg, #dc2626, #ef4444)",
      color: "white",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      animation: "pulse 2s infinite",
      zIndex: 2,
    },
    matchHeader: {
      padding: "24px 24px 16px 24px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      borderBottom: "1px solid #e2e8f0",
      position: "relative",
    },
    matchDate: {
      fontSize: "14px",
      color: "#64748b",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "8px",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    matchBody: {
      padding: "32px 24px",
    },
    teamsContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    teamSection: {
      flex: "1",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    },
    logoImage: {
      width: "64px",
      height: "64px",
      objectFit: "contain",
      // border: "1px solid #d1d5db",
      // borderRadius: "8px",
    },
    teamName: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#1e293b",
      lineHeight: "1.2",
      maxWidth: "120px",
      wordBreak: "break-word",
    },
    teamScore: {
      fontSize: "36px",
      fontWeight: "900",
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      lineHeight: "1",
    },
    vsSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      margin: "0 24px",
      gap: "8px",
    },
    vsText: {
      fontSize: "14px",
      fontWeight: "700",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    vsDivider: {
      width: "40px",
      height: "2px",
      background: "linear-gradient(90deg, #e2e8f0, #cbd5e1, #e2e8f0)",
      borderRadius: "1px",
    },
    matchLocation: {
      marginTop: "20px",
      padding: "12px 16px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontSize: "14px",
      color: "#64748b",
    },
  };

  const sortedMatches = matches.sort((a, b) => {
    // Priorité : live > à venir > terminé
    if (a.status === "live" && b.status !== "live") return -1;
    if (b.status === "live" && a.status !== "live") return 1;
    return new Date(a.startAt) - new Date(b.startAt);
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw
            size={48}
            style={{
              animation: "spin 2s linear infinite",
              color: "#3b82f6",
            }}
          />
          <div style={styles.loadingText}>Chargement des matches...</div>
        </div>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}
        </style>
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
          <Trophy size={32} />
          Matches en direct et à venir
        </h1>
        <div style={styles.subtitle}>Suivez tous les matches en temps réel</div>
      </div>

      {sortedMatches.length === 0 ? (
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
            Aucun match programmé
          </h3>
          <p style={{ fontSize: "16px", margin: 0 }}>
            Les prochains matches apparaîtront ici dès qu'ils seront planifiés
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {sortedMatches.map((match) => {
            const statusInfo = getStatusStyle(match.status);
            const isLive = match.status?.toLowerCase() === "live";

            return (
              <div
                key={match.id}
                style={styles.matchCard}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, styles.matchCardHover)
                }
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                {isLive && (
                  <div style={styles.liveIndicator}>
                    <Flame size={14} />
                    LIVE
                  </div>
                )}

                <div style={styles.matchHeader}>
                  <div style={styles.matchDate}>
                    <Clock size={14} />
                    {formatDate(match.startAt)}
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusInfo.backgroundColor,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.icon}
                    {statusInfo.text}
                  </div>
                </div>

                <div style={styles.matchBody}>
                  <div style={styles.teamsContainer}>
                    <div style={styles.teamSection}>
                      <img
                        src={match.homeTeam.logoUrl}
                        alt="Logo de l'équipe"
                        style={styles.logoImage}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div style={styles.teamName}>
                        {getTeamName(match.homeTeamId)}
                      </div>
                      <div style={styles.teamScore}>{match.homeScore ?? 0}</div>
                    </div>

                    <div style={styles.vsSection}>
                      <div style={styles.vsText}>VS</div>
                      <div style={styles.vsDivider} />
                    </div>

                    <div style={styles.teamSection}>
                      <img
                        src={match.awayTeam.logoUrl}
                        alt="Logo de l'équipe"
                        style={styles.logoImage}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div style={styles.teamName}>
                        {getTeamName(match.awayTeamId)}
                      </div>
                      <div style={styles.teamScore}>{match.awayScore ?? 0}</div>
                    </div>
                  </div>

                  {match.location && (
                    <div style={styles.matchLocation}>
                      <Flag size={16} />
                      {match.location}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
}
