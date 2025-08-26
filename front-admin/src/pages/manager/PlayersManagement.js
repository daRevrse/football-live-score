// front-admin/src/pages/manager/PlayersManagement.js
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  Activity,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getTeamPlayers,
  deletePlayer,
  updatePlayerStatus,
} from "../../services/api";
import PlayerModal from "../../components/manager/PlayerModal";

export default function PlayersManagement() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionDropdown, setActionDropdown] = useState(null);

  const positions = [
    "Gardien",
    "Défenseur central",
    "Latéral droit",
    "Latéral gauche",
    "Milieu défensif",
    "Milieu central",
    "Milieu offensif",
    "Ailier droit",
    "Ailier gauche",
    "Attaquant",
    "Avant-centre",
  ];

  const statuses = [
    { value: "active", label: "Actif", color: "#10b981" },
    { value: "injured", label: "Blessé", color: "#ef4444" },
    { value: "suspended", label: "Suspendu", color: "#f59e0b" },
    { value: "inactive", label: "Inactif", color: "#6b7280" },
  ];

  useEffect(() => {
    if (user?.teamId) {
      loadPlayers();
    }
  }, [user]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, selectedPosition, selectedStatus]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await getTeamPlayers(user.teamId);
      setPlayers(response.data.players || []);
    } catch (err) {
      setError("Erreur de chargement des joueurs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (player) =>
          `${player.firstName} ${player.lastName}`
            .toLowerCase()
            .includes(term) ||
          player.jerseyNumber?.toString().includes(term) ||
          player.position?.toLowerCase().includes(term)
      );
    }

    if (selectedPosition) {
      filtered = filtered.filter(
        (player) => player.position === selectedPosition
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((player) => player.status === selectedStatus);
    }

    setFilteredPlayers(filtered);
  };

  const handlePlayerAction = async (action, player) => {
    try {
      switch (action) {
        case "edit":
          setSelectedPlayer(player);
          setIsModalOpen(true);
          break;
        case "delete":
          if (
            window.confirm(
              `Êtes-vous sûr de vouloir supprimer ${player.firstName} ${player.lastName} ?`
            )
          ) {
            await deletePlayer(player.id);
            await loadPlayers();
          }
          break;
        case "status":
          const newStatus = player.status === "active" ? "injured" : "active";
          await updatePlayerStatus(player.id, { status: newStatus });
          await loadPlayers();
          break;
      }
    } catch (err) {
      setError("Erreur lors de l'action sur le joueur");
      console.error(err);
    } finally {
      setActionDropdown(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
    loadPlayers();
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find((s) => s.value === status);
    return statusObj?.color || "#6b7280";
  };

  const styles = {
    container: {
      padding: "24px",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "32px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#1e293b",
      margin: 0,
    },
    button: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    buttonPrimary: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    filtersCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #e2e8f0",
      marginBottom: "24px",
    },
    filtersRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: "16px",
      alignItems: "end",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s ease",
    },
    select: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "white",
      cursor: "pointer",
    },
    searchInput: {
      position: "relative",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
    },
    searchInputField: {
      paddingLeft: "40px",
    },
    playersCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
    },
    playersHeader: {
      padding: "20px 24px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    playersCount: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1e293b",
    },
    playersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "16px",
      padding: "24px",
    },
    playerCard: {
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "20px",
      transition: "all 0.2s ease",
      position: "relative",
    },
    playerCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    },
    playerHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1e293b",
      margin: "0 0 4px 0",
    },
    playerMeta: {
      fontSize: "14px",
      color: "#64748b",
      margin: 0,
    },
    playerNumber: {
      width: "40px",
      height: "40px",
      borderRadius: "8px",
      backgroundColor: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: "bold",
      color: "#475569",
    },
    playerDetails: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "16px",
    },
    playerDetail: {
      fontSize: "12px",
    },
    playerDetailLabel: {
      color: "#64748b",
      display: "block",
      marginBottom: "2px",
    },
    playerDetailValue: {
      color: "#1e293b",
      fontWeight: "500",
    },
    playerFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusBadge: {
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "capitalize",
    },
    actionButton: {
      padding: "6px",
      border: "none",
      borderRadius: "6px",
      backgroundColor: "transparent",
      cursor: "pointer",
      color: "#64748b",
      transition: "all 0.2s ease",
    },
    actionDropdown: {
      position: "absolute",
      top: "100%",
      right: "0",
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      zIndex: 10,
      minWidth: "150px",
    },
    actionItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      fontSize: "14px",
      color: "#374151",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#64748b",
    },
    loading: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      color: "#64748b",
    },
    error: {
      padding: "16px",
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      borderRadius: "8px",
      marginBottom: "24px",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Chargement des joueurs...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.error}>
          <AlertCircle size={16} style={{ marginRight: "8px" }} />
          {error}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>Gestion des Joueurs</h1>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          Ajouter un joueur
        </button>
      </div>

      {/* Filtres */}
      <div style={styles.filtersCard}>
        <div style={styles.filtersRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Rechercher</label>
            <div style={styles.searchInput}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Nom, numéro, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...styles.input, ...styles.searchInputField }}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              style={styles.select}
            >
              <option value="">Toutes les positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={styles.select}
            >
              <option value="">Tous les statuts</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des joueurs */}
      <div style={styles.playersCard}>
        <div style={styles.playersHeader}>
          <div style={styles.playersCount}>
            {filteredPlayers.length} joueur
            {filteredPlayers.length !== 1 ? "s" : ""} trouvé
            {filteredPlayers.length !== 1 ? "s" : ""}
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <div style={styles.emptyState}>
            <Users size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <h3 style={{ margin: "0 0 8px", color: "#374151" }}>
              {players.length === 0 ? "Aucun joueur" : "Aucun résultat"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px" }}>
              {players.length === 0
                ? "Commencez par ajouter des joueurs à votre équipe"
                : "Essayez de modifier vos critères de recherche"}
            </p>
            {players.length === 0 && (
              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={16} />
                Ajouter le premier joueur
              </button>
            )}
          </div>
        ) : (
          <div style={styles.playersGrid}>
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                style={styles.playerCard}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, styles.playerCardHover)
                }
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={styles.playerHeader}>
                  <div style={styles.playerInfo}>
                    <h3 style={styles.playerName}>
                      {player.firstName} {player.lastName}
                    </h3>
                    <p style={styles.playerMeta}>{player.position}</p>
                  </div>
                  <div style={styles.playerNumber}>{player.jerseyNumber}</div>
                </div>

                <div style={styles.playerDetails}>
                  <div style={styles.playerDetail}>
                    <span style={styles.playerDetailLabel}>Nationalité</span>
                    <span style={styles.playerDetailValue}>
                      {player.nationality || "Non spécifiée"}
                    </span>
                  </div>
                  <div style={styles.playerDetail}>
                    <span style={styles.playerDetailLabel}>Âge</span>
                    <span style={styles.playerDetailValue}>
                      {player.age || player.dateOfBirth
                        ? new Date().getFullYear() -
                          new Date(player.dateOfBirth).getFullYear()
                        : "N/A"}{" "}
                      ans
                    </span>
                  </div>
                </div>

                <div style={styles.playerFooter}>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(player.status) + "20",
                      color: getStatusColor(player.status),
                    }}
                  >
                    {statuses.find((s) => s.value === player.status)?.label ||
                      player.status}
                  </div>

                  <div style={{ position: "relative" }}>
                    <button
                      style={styles.actionButton}
                      onClick={() =>
                        setActionDropdown(
                          actionDropdown === player.id ? null : player.id
                        )
                      }
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#f1f5f9")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "transparent")
                      }
                    >
                      <MoreVertical size={16} />
                    </button>

                    {actionDropdown === player.id && (
                      <div style={styles.actionDropdown}>
                        <div
                          style={styles.actionItem}
                          onClick={() => handlePlayerAction("edit", player)}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#f8fafc")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "transparent")
                          }
                        >
                          <Edit size={14} />
                          Modifier
                        </div>
                        <div
                          style={styles.actionItem}
                          onClick={() => handlePlayerAction("status", player)}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#f8fafc")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "transparent")
                          }
                        >
                          <Activity size={14} />
                          {player.status === "active"
                            ? "Marquer blessé"
                            : "Marquer actif"}
                        </div>
                        <div
                          style={{ ...styles.actionItem, color: "#dc2626" }}
                          onClick={() => handlePlayerAction("delete", player)}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#fef2f2")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "transparent")
                          }
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification */}
      {isModalOpen && (
        <PlayerModal
          player={selectedPlayer}
          teamId={user.teamId}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose();
            loadPlayers();
          }}
        />
      )}

      {/* Overlay pour fermer les dropdowns */}
      {actionDropdown && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
          onClick={() => setActionDropdown(null)}
        />
      )}
    </div>
  );
}
