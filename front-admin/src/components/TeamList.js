import React, { useEffect, useState } from "react";
import { getTeams, deleteTeam } from "../services/api";
import socket from "../services/socket";
import TeamForm from "./TeamForm";
import TeamItem from "./TeamItem";
import { Loader2, RefreshCw, AlertCircle, Plus, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TeamList() {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showTeamFormModal, setShowTeamFormModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadTeams();

    socket.on("team_updated", (updatedTeam) => {
      setTeams((prev) =>
        prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
      );
    });

    socket.on("team_created", (newTeam) => {
      setTeams((prev) => [...prev, newTeam]);
      setShowTeamFormModal(false);
    });

    socket.on("team_deleted", (deletedTeamId) => {
      setTeams((prev) => prev.filter((t) => t.id !== deletedTeamId));
      if (selectedTeamId === deletedTeamId) {
        setSelectedTeamId(null);
      }
    });

    return () => {
      socket.off("team_updated");
      socket.off("team_created");
      socket.off("team_deleted");
    };
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getTeams();
      setTeams(response.data.teams);
    } catch (err) {
      setError("Erreur lors du chargement des équipes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
      try {
        await deleteTeam(teamId);
      } catch (err) {
        setError("Erreur lors de la suppression de l'équipe");
        console.error(err);
      }
    }
  };

  const handleSelectTeam = (teamId) => {
    setSelectedTeamId(teamId === selectedTeamId ? null : teamId);
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styles CSS intégrés
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "24px",
      position: "relative",
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
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "24px",
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
      maxWidth: "800px",
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <Users size={24} />
          Liste des équipes
          <span
            style={{ fontSize: "14px", fontWeight: "normal", color: "#6b7280" }}
          >
            ({teams.length} équipe{teams.length !== 1 ? "s" : ""})
          </span>
        </h2>
        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={() => loadTeams()}
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
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <RefreshCw size={16} />
            )}
            Actualiser
          </button>
          {user?.role === "Admin" && (
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={() => setShowTeamFormModal(true)}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.buttonHover)
              }
              onMouseLeave={(e) => {
                e.target.style.transform = "none";
                e.target.style.boxShadow = "none";
              }}
            >
              <Plus size={16} />
              Nouvelle équipe
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher une équipe..."
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
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          Chargement des équipes...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div style={styles.emptyState}>
          {searchTerm ? (
            <>
              <Users size={48} style={{ marginBottom: "16px" }} />
              <h3>Aucune équipe trouvée</h3>
              <p>
                Aucune équipe ne correspond à votre recherche "{searchTerm}"
              </p>
            </>
          ) : (
            <>
              <Users size={48} style={{ marginBottom: "16px" }} />
              <h3>Aucune équipe disponible</h3>
              <p>Commencez par créer votre première équipe</p>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  marginTop: "16px",
                }}
                onClick={() => setShowTeamFormModal(true)}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.buttonHover)
                }
                onMouseLeave={(e) => {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "none";
                }}
              >
                <Plus size={16} />
                Créer une équipe
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredTeams.map((team) => (
            <TeamItem
              key={team.id}
              team={team}
              onDelete={handleDeleteTeam}
              onSelect={handleSelectTeam}
              isSelected={selectedTeamId === team.id}
            />
          ))}
        </div>
      )}

      {showTeamFormModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
                Créer une nouvelle équipe
              </h3>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowTeamFormModal(false)}
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
            <TeamForm
              onTeamCreated={() => setShowTeamFormModal(false)}
              onCancel={() => setShowTeamFormModal(false)}
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
