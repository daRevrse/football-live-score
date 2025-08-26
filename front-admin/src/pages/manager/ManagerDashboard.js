// front-admin/src/pages/manager/ManagerDashboard.js
import React, { useEffect, useState } from "react";
import {
  Users,
  Trophy,
  Calendar,
  AlertCircle,
  Plus,
  Edit3,
  Activity,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getTeamPlayers,
  getTeamStats,
  getTeamMatches,
} from "../../services/api";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.teamId) {
      loadDashboardData();
      setTeam(user.managedTeam || { name: "Votre équipe" });
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les joueurs
      const playersResponse = await getTeamPlayers(user.teamId);
      const playersData = playersResponse.data || {};

      setPlayers(playersData.players || []);
      setStats(
        playersData.stats || {
          total: 0,
          active: 0,
          injured: 0,
          suspended: 0,
        }
      );

      // Essayer de charger les matchs (peut échouer si pas encore implémenté)
      try {
        const matchesResponse = await getTeamMatches(user.teamId, {
          limit: 5,
          status: "live,scheduled",
        });
        setMatches(matchesResponse.data || []);
      } catch (matchError) {
        console.log("Matchs pas encore disponibles:", matchError);
        setMatches([]);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
      setError("Erreur de chargement des données");
      // Valeurs par défaut en cas d'erreur
      setPlayers([]);
      setStats({ total: 0, active: 0, injured: 0, suspended: 0 });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#10b981",
      injured: "#ef4444",
      suspended: "#f59e0b",
      inactive: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: "Actif",
      injured: "Blessé",
      suspended: "Suspendu",
      inactive: "Inactif",
    };
    return labels[status] || status;
  };

  const navigateTo = (path) => {
    window.location.href = path;
  };

  const styles = {
    container: {
      padding: "24px",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
    },
    header: {
      marginBottom: "32px",
    },
    welcomeCard: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      borderRadius: "16px",
      padding: "24px",
      color: "white",
      marginBottom: "24px",
      boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
      margin: "0 0 8px 0",
    },
    subtitle: {
      fontSize: "16px",
      opacity: 0.9,
      margin: 0,
    },
    refreshButton: {
      position: "absolute",
      top: "20px",
      right: "20px",
      padding: "8px",
      border: "none",
      borderRadius: "50%",
      backgroundColor: "rgba(255,255,255,0.2)",
      color: "white",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "32px",
    },
    statCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #e2e8f0",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "pointer",
    },
    statCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    },
    statIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "12px",
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1e293b",
      margin: "0 0 4px 0",
    },
    statLabel: {
      fontSize: "14px",
      color: "#64748b",
      margin: 0,
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "24px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    cardTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#1e293b",
      margin: 0,
    },
    button: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      textDecoration: "none",
    },
    buttonPrimary: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#f1f5f9",
      color: "#475569",
    },
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
    playersList: {
      maxHeight: "400px",
      overflowY: "auto",
    },
    playerItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid #f1f5f9",
      transition: "background-color 0.2s ease",
    },
    playerItemHover: {
      backgroundColor: "#f8fafc",
      borderRadius: "6px",
      padding: "12px",
    },
    playerInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    playerAvatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "600",
      color: "#64748b",
      border: "2px solid #f1f5f9",
    },
    playerDetails: {
      display: "flex",
      flexDirection: "column",
    },
    playerName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#1e293b",
      margin: 0,
    },
    playerMeta: {
      fontSize: "12px",
      color: "#64748b",
      margin: 0,
    },
    statusBadge: {
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "capitalize",
    },
    matchItem: {
      padding: "16px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      marginBottom: "12px",
      transition: "all 0.2s ease",
    },
    matchItemHover: {
      borderColor: "#3b82f6",
      backgroundColor: "#f8fafc",
    },
    matchTeams: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "4px",
    },
    matchDate: {
      fontSize: "12px",
      color: "#64748b",
    },
    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
      color: "#64748b",
    },
    emptyIcon: {
      margin: "0 auto 16px",
      opacity: 0.3,
    },
    loading: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      color: "#64748b",
      gap: "16px",
    },
    loadingSpinner: {
      animation: "spin 1s linear infinite",
    },
    error: {
      padding: "16px",
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      borderRadius: "8px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    quickActions: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginTop: "16px",
    },
    quickActionButton: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      color: "#475569",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      cursor: "pointer",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw size={32} style={styles.loadingSpinner} />
          <div>Chargement du dashboard...</div>
        </div>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.error}>
          <AlertCircle size={16} />
          {error}
          <button
            onClick={loadDashboardData}
            style={{
              marginLeft: "auto",
              padding: "4px 8px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#dc2626",
              color: "white",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      <div style={styles.header}>
        <div style={{ ...styles.welcomeCard, position: "relative" }}>
          <button
            style={styles.refreshButton}
            onClick={loadDashboardData}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "rgba(255,255,255,0.2)")
            }
            title="Actualiser les données"
          >
            <RefreshCw size={16} />
          </button>

          <h1 style={styles.title}>
            Bienvenue, {user.firstName || user.username} !
          </h1>
          <p style={styles.subtitle}>
            Gérez votre équipe {team?.name || "votre équipe"} depuis ce tableau
            de bord
          </p>
        </div>

        {/* Statistiques rapides */}
        <div style={styles.statsGrid}>
          <div
            style={styles.statCard}
            onClick={() => navigateTo("/manager/players")}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.statCardHover)
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ ...styles.statIcon, backgroundColor: "#dbeafe" }}>
              <Users size={20} color="#3b82f6" />
            </div>
            <div style={styles.statValue}>{stats.total || 0}</div>
            <div style={styles.statLabel}>Joueurs Total</div>
          </div>

          <div
            style={styles.statCard}
            onClick={() => navigateTo("/manager/players?status=active")}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.statCardHover)
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ ...styles.statIcon, backgroundColor: "#dcfce7" }}>
              <Activity size={20} color="#16a34a" />
            </div>
            <div style={styles.statValue}>{stats.active || 0}</div>
            <div style={styles.statLabel}>Joueurs Actifs</div>
          </div>

          <div
            style={styles.statCard}
            onClick={() => navigateTo("/manager/players?status=injured")}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.statCardHover)
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ ...styles.statIcon, backgroundColor: "#fee2e2" }}>
              <AlertCircle size={20} color="#dc2626" />
            </div>
            <div style={styles.statValue}>{stats.injured || 0}</div>
            <div style={styles.statLabel}>Blessés</div>
          </div>

          <div
            style={styles.statCard}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.statCardHover)
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ ...styles.statIcon, backgroundColor: "#fef3c7" }}>
              <Calendar size={20} color="#d97706" />
            </div>
            <div style={styles.statValue}>{matches.length}</div>
            <div style={styles.statLabel}>Prochains Matchs</div>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* Liste des joueurs */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Effectif de l'équipe</h2>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={() => navigateTo("/manager/players")}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.buttonHover)
              }
              onMouseLeave={(e) => {
                e.target.style.transform = "none";
                e.target.style.boxShadow = "none";
              }}
            >
              <Plus size={16} />
              Gérer les joueurs
            </button>
          </div>

          <div style={styles.playersList}>
            {players.length === 0 ? (
              <div style={styles.emptyState}>
                <Users size={48} style={styles.emptyIcon} />
                <h3 style={{ margin: "0 0 8px", color: "#374151" }}>
                  Aucun joueur dans l'effectif
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "14px" }}>
                  Commencez par ajouter des joueurs à votre équipe
                </p>
                <button
                  style={{ ...styles.button, ...styles.buttonPrimary }}
                  onClick={() => navigateTo("/manager/players")}
                >
                  <Plus size={16} />
                  Ajouter le premier joueur
                </button>
              </div>
            ) : (
              <>
                {players.slice(0, 8).map((player) => (
                  <div
                    key={player.id}
                    style={styles.playerItem}
                    onMouseEnter={(e) =>
                      Object.assign(
                        e.currentTarget.style,
                        styles.playerItemHover
                      )
                    }
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.padding = "12px 0";
                    }}
                  >
                    <div style={styles.playerInfo}>
                      <div style={styles.playerAvatar}>
                        {player.jerseyNumber || "?"}
                      </div>
                      <div style={styles.playerDetails}>
                        <div style={styles.playerName}>
                          {player.firstName} {player.lastName}
                        </div>
                        <div style={styles.playerMeta}>
                          {player.position} •{" "}
                          {player.nationality || "Non spécifiée"}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(player.status) + "20",
                        color: getStatusColor(player.status),
                      }}
                    >
                      {getStatusLabel(player.status)}
                    </div>
                  </div>
                ))}

                {players.length > 8 && (
                  <div style={{ textAlign: "center", marginTop: "16px" }}>
                    <button
                      style={{ ...styles.button, ...styles.buttonSecondary }}
                      onClick={() => navigateTo("/manager/players")}
                    >
                      Voir tous les joueurs ({players.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar avec matchs et actions rapides */}
        <div>
          {/* Prochains matchs */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Prochains Matchs</h3>
              <Calendar size={20} color="#64748b" />
            </div>

            {matches.length === 0 ? (
              <div style={styles.emptyState}>
                <Calendar size={32} style={styles.emptyIcon} />
                <p style={{ fontSize: "14px", margin: 0 }}>
                  Aucun match programmé
                </p>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  style={styles.matchItem}
                  onMouseEnter={(e) =>
                    Object.assign(e.currentTarget.style, styles.matchItemHover)
                  }
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={styles.matchTeams}>
                    {match.homeTeam?.name || "Équipe A"} vs{" "}
                    {match.awayTeam?.name || "Équipe B"}
                  </div>
                  <div style={styles.matchDate}>
                    {new Date(match.startAt).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions rapides */}
          <div style={{ ...styles.card, marginTop: "16px" }}>
            <h3 style={styles.cardTitle}>Actions Rapides</h3>
            <div style={styles.quickActions}>
              <div
                style={styles.quickActionButton}
                onClick={() => navigateTo("/manager/players")}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f1f5f9";
                  e.target.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.borderColor = "#e2e8f0";
                }}
              >
                <Users size={16} />
                Gérer l'effectif
              </div>

              <div
                style={styles.quickActionButton}
                onClick={() => navigateTo("/manager/team/edit")}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f1f5f9";
                  e.target.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.borderColor = "#e2e8f0";
                }}
              >
                <Edit3 size={16} />
                Modifier les infos de l'équipe
              </div>

              <div
                style={styles.quickActionButton}
                onClick={() => navigateTo("/manager/stats")}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f1f5f9";
                  e.target.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.borderColor = "#e2e8f0";
                }}
              >
                <BarChart3 size={16} />
                Voir les statistiques
              </div>

              <div
                style={styles.quickActionButton}
                onClick={() => navigateTo("/manager/matches")}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f1f5f9";
                  e.target.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.borderColor = "#e2e8f0";
                }}
              >
                <Trophy size={16} />
                Historique des matchs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
