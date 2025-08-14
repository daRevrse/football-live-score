import React, { useEffect, useState } from "react";
import { getMatches, deleteMatch } from "../services/api";
import socket from "../services/socket";
import MatchForm from "./MatchForm";
import MatchEditor from "./MatchEditor";
import {
  Calendar,
  Clock,
  Users,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Flag,
  AlertCircle,
  X,
} from "lucide-react";

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMatches();

    const handleMatchUpdated = (updatedMatch) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
      if (selectedMatchId === updatedMatch.id) {
        setSelectedMatchId(null);
      }
    };

    socket.on("match_updated", handleMatchUpdated);
    socket.on("match_created", (newMatch) => {
      setMatches((prev) => [...prev, newMatch]);
      setShowMatchForm(false);
    });

    socket.on("match_deleted", (deletedMatchId) => {
      setMatches((prev) => prev.filter((m) => m.id !== deletedMatchId));
      if (selectedMatchId === deletedMatchId) {
        setSelectedMatchId(null);
      }
    });

    return () => {
      socket.off("match_updated", handleMatchUpdated);
      socket.off("match_created");
      socket.off("match_deleted");
    };
  }, [selectedMatchId]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMatches();
      setMatches(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des matches");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) {
      try {
        await deleteMatch(matchId);
      } catch (err) {
        setError("Erreur lors de la suppression du match");
        console.error(err);
      }
    }
  };

  const filteredMatches = matches.filter(
    (match) =>
      match.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styles CSS intégrés
  const styles = {
    container: {
      padding: "24px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "16px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      margin: 0,
    },
    actions: {
      display: "flex",
      gap: "12px",
    },
    button: {
      padding: "8px 16px",
      borderRadius: "8px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "none",
      fontSize: "14px",
    },
    buttonPrimary: {
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    },
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    },
    searchInput: {
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "16px",
      width: "100%",
      maxWidth: "400px",
      marginBottom: "24px",
    },
    searchInputFocus: {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    errorAlert: {
      padding: "16px",
      borderRadius: "8px",
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "24px",
    },
    loading: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      gap: "8px",
      color: "#6b7280",
    },
    emptyState: {
      textAlign: "center",
      padding: "40px",
      color: "#6b7280",
      backgroundColor: "#f9fafb",
      borderRadius: "12px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
      gap: "24px",
    },
    matchCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      overflow: "hidden",
      border: "1px solid #e5e7eb",
      transition: "all 0.2s ease",
    },
    matchCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
    },
    matchHeader: {
      padding: "16px",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    matchTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      margin: 0,
    },
    matchBody: {
      padding: "16px",
    },
    matchInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    matchInfoRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    matchScore: {
      fontSize: "20px",
      fontWeight: "bold",
      textAlign: "center",
      margin: "12px 0",
    },
    matchStatus: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "500",
    },
    matchActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      padding: "16px",
      borderTop: "1px solid #e5e7eb",
    },
    actionButton: {
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      cursor: "pointer",
      border: "none",
      transition: "all 0.2s ease",
    },
    editButton: {
      backgroundColor: "#f0f5ff",
      color: "#3b82f6",
    },
    deleteButton: {
      backgroundColor: "#fef2f2",
      color: "#ef4444",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      maxWidth: "1200px",
      width: "100%",
      maxHeight: "90vh",
      overflowY: "auto",
      position: "relative",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px",
      borderBottom: "1px solid #e5e7eb",
      position: "sticky",
      top: 0,
      backgroundColor: "white",
      zIndex: 10,
    },
    modalCloseButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#6b7280",
      padding: "8px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    },
    modalCloseButtonHover: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    },
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "terminé":
        return { backgroundColor: "#f0fdf4", color: "#166534" };
      case "en cours":
        return { backgroundColor: "#fffbeb", color: "#b45309" };
      case "à venir":
        return { backgroundColor: "#eff6ff", color: "#1e40af" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#4b5563" };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <Calendar size={24} />
          Liste des matches
          <span
            style={{ fontSize: "14px", fontWeight: "normal", color: "#6b7280" }}
          >
            ({matches.length} match{matches.length !== 1 ? "es" : ""})
          </span>
        </h2>
        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={() => loadMatches()}
            disabled={isLoading}
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.buttonHover)
            }
            onMouseLeave={(e) => {
              e.target.style.transform = "none";
              e.target.style.boxShadow = "none";
            }}
          >
            {isLoading ? (
              <RefreshCw
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <RefreshCw size={16} />
            )}
            Actualiser
          </button>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={() => setShowMatchForm(true)}
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.buttonHover)
            }
            onMouseLeave={(e) => {
              e.target.style.transform = "none";
              e.target.style.boxShadow = "none";
            }}
          >
            <Plus size={16} />
            Nouveau match
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher un match..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
        onFocus={(e) => Object.assign(e.target.style, styles.searchInputFocus)}
        onBlur={(e) => {
          e.target.style.borderColor = "#d1d5db";
          e.target.style.boxShadow = "none";
        }}
      />

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={styles.loading}>
          <RefreshCw
            size={24}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Chargement des matches...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div style={styles.emptyState}>
          {searchTerm ? (
            <>
              <Calendar size={48} style={{ marginBottom: "16px" }} />
              <h3>Aucun match trouvé</h3>
              <p>Aucun match ne correspond à votre recherche "{searchTerm}"</p>
            </>
          ) : (
            <>
              <Calendar size={48} style={{ marginBottom: "16px" }} />
              <h3>Aucun match disponible</h3>
              <p>Commencez par créer votre premier match</p>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  marginTop: "16px",
                }}
                onClick={() => setShowMatchForm(true)}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.buttonHover)
                }
                onMouseLeave={(e) => {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "none";
                }}
              >
                <Plus size={16} />
                Créer un match
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              style={styles.matchCard}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, styles.matchCardHover)
              }
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.05)";
              }}
            >
              <div style={styles.matchHeader}>
                <h3 style={styles.matchTitle}>
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </h3>
                <span
                  style={{
                    ...styles.matchStatus,
                    ...getStatusColor(match.status),
                  }}
                >
                  {match.status}
                </span>
              </div>
              <div style={styles.matchBody}>
                <div style={styles.matchInfo}>
                  <div style={styles.matchScore}>
                    {match.homeScore} - {match.awayScore}
                  </div>
                  <div style={styles.matchInfoRow}>
                    <Clock size={16} />
                    <span>{new Date(match.startAt).toLocaleString()}</span>
                  </div>
                  <div style={styles.matchInfoRow}>
                    <Flag size={16} />
                    <span>{match.location || "Lieu non spécifié"}</span>
                  </div>
                </div>
              </div>
              <div style={styles.matchActions}>
                <button
                  style={{ ...styles.actionButton, ...styles.editButton }}
                  onClick={() => setSelectedMatchId(match.id)}
                >
                  <Edit size={14} />
                  Éditer
                </button>
                <button
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                  onClick={() => handleDeleteMatch(match.id)}
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showMatchForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
                Créer un nouveau match
              </h3>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowMatchForm(false)}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.modalCloseButtonHover)
                }
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <X size={24} />
              </button>
            </div>
            <MatchForm
              onMatchCreated={() => setShowMatchForm(false)}
              onCancel={() => setShowMatchForm(false)}
            />
          </div>
        </div>
      )}

      {selectedMatchId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
                Éditer le match
              </h3>
              <button
                style={styles.modalCloseButton}
                onClick={() => setSelectedMatchId(null)}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.modalCloseButtonHover)
                }
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <X size={24} />
              </button>
            </div>
            <MatchEditor
              // matchId={selectedMatchId}
              match={matches.find((m) => m.id === selectedMatchId)}
              onClose={() => setSelectedMatchId(null)}
              onUpdate={loadMatches}
            />
          </div>
        </div>
      )}

      {/* Animation CSS pour le loader */}
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
