import React, { useEffect, useState } from "react";
import { createCompleteMatch, getTeams } from "../services/api";
import {
  Users,
  X,
  Calendar,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";

export default function MatchForm({ onMatchAdded, onCancel }) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    homeTeamId: "",
    awayTeamId: "",
    startAt: "",
    // location: "",
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await getTeams();
        setTeams(response.data.teams);
      } catch (err) {
        setError("Erreur lors du chargement des équipes");
        console.error(err);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { homeTeamId, awayTeamId, startAt } = formData;

    if (homeTeamId === awayTeamId) {
      setError("Veuillez sélectionner deux équipes différentes");
      return;
    }

    if (!homeTeamId || !awayTeamId) {
      setError("Veuillez sélectionner les deux équipes");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createCompleteMatch(homeTeamId, awayTeamId, startAt);
      if (onMatchAdded) onMatchAdded();
      resetForm();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erreur lors de la création du match";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      homeTeamId: "",
      awayTeamId: "",
      startAt: "",
      // location: "",
    });
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  // Styles CSS intégrés
  const styles = {
    container: {
      backgroundColor: "white",
      margin: "0 auto",
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "600px",
      width: "100%",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "24px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      margin: 0,
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
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "500",
      color: "#374151",
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "16px",
      transition: "all 0.2s ease",
    },
    selectFocus: {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "16px",
      transition: "all 0.2s ease",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      margin: "24px 0",
      color: "#6b7280",
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "#e5e7eb",
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "32px",
    },
    button: {
      padding: "10px 20px",
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
    buttonDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
    },
    loadingIcon: {
      animation: "spin 1s linear infinite",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Users size={24} />
        <h3 style={styles.title}>Nouveau match</h3>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <X size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Équipe à domicile</label>
          <select
            value={formData.homeTeamId}
            onChange={(e) => handleInputChange("homeTeamId", e.target.value)}
            disabled={teamsLoading}
            style={{
              ...styles.select,
              ...(teamsLoading ? { opacity: 0.7 } : {}),
            }}
            onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="">Sélectionnez une équipe</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span>VS</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Équipe à l'extérieur</label>
          <select
            value={formData.awayTeamId}
            onChange={(e) => handleInputChange("awayTeamId", e.target.value)}
            disabled={teamsLoading}
            style={{
              ...styles.select,
              ...(teamsLoading ? { opacity: 0.7 } : {}),
            }}
            onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="">Sélectionnez une équipe</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* <div style={styles.formGroup}>
          <label style={styles.label}>
            <Clock size={16} style={{ marginRight: "8px" }} />
            Date et heure
          </label>
          <input
            type="datetime-local"
            value={formData.startAt}
            onChange={(e) => handleInputChange("startAt", e.target.value)}
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          />
        </div> */}

        <div style={styles.actions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) =>
                !isLoading && Object.assign(e.target.style, styles.buttonHover)
              }
              onMouseLeave={(e) => {
                e.target.style.transform = "none";
                e.target.style.boxShadow = "none";
              }}
              disabled={isLoading}
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={(e) =>
              !isLoading && Object.assign(e.target.style, styles.buttonHover)
            }
            onMouseLeave={(e) => {
              e.target.style.transform = "none";
              e.target.style.boxShadow = "none";
            }}
            disabled={isLoading || teamsLoading}
          >
            {isLoading ? (
              <RefreshCw size={16} style={styles.loadingIcon} />
            ) : (
              <Plus size={16} />
            )}
            Créer le match
          </button>
        </div>
      </form>

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
