import React from "react";
import { Trash2, Users, BarChart2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TeamItem({ team, onDelete, onSelect, isSelected }) {
  const { user } = useAuth();
  // Styles CSS intégrés
  const styles = {
    container: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      border: `1px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`,
      overflow: "hidden",
      transition: "all 0.2s ease",
      cursor: "pointer",
      position: "relative",
    },
    containerHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
      borderColor: "#3b82f6",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px",
      background: isSelected
        ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
        : "#f9fafb",
      color: isSelected ? "white" : "#374151",
    },
    shortName: {
      fontSize: "20px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    deleteButton: {
      background: "none",
      border: "none",
      color: isSelected ? "white" : "#ef4444",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontWeight: "500",
      fontSize: "14px",
      padding: "6px 10px",
      borderRadius: "6px",
      transition: "all 0.2s ease",
    },
    deleteButtonHover: {
      backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "#fef2f2",
    },
    body: {
      padding: "16px",
    },
    name: {
      fontSize: "16px",
      fontWeight: "500",
      marginBottom: "12px",
    },
    logoContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "12px",
    },
    logo: {
      width: "64px",
      height: "64px",
      objectFit: "contain",
      borderRadius: "8px",
    },
    colorsContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "12px",
    },
    colorSwatch: {
      width: "24px",
      height: "24px",
      borderRadius: "4px",
      border: "1px solid #d1d5db",
    },
    statsContainer: {
      display: "flex",
      gap: "12px",
      marginTop: "12px",
      fontSize: "14px",
      color: "#6b7280",
    },
    statItem: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    gradientPreview: {
      height: "24px",
      borderRadius: "6px",
      marginTop: "8px",
      background:
        team.primaryColor && team.secondaryColor
          ? `linear-gradient(45deg, ${team.primaryColor}, ${team.secondaryColor})`
          : "#f3f4f6",
    },
  };

  return (
    <div
      style={styles.container}
      onClick={() => onSelect && onSelect(team.id)}
      onMouseEnter={(e) =>
        Object.assign(e.currentTarget.style, styles.containerHover)
      }
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
        e.currentTarget.style.borderColor = isSelected ? "#3b82f6" : "#e5e7eb";
      }}
    >
      <div style={styles.header}>
        <div style={styles.shortName}>
          <Users size={18} />
          {team.shortName}
        </div>
        {user?.role === "Admin" && (
          <button
            style={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team.id);
            }}
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.deleteButtonHover)
            }
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        )}
      </div>

      <div style={styles.body}>
        {team.logoUrl && (
          <div style={styles.logoContainer}>
            <img
              src={team.logoUrl}
              alt={`Logo ${team.name}`}
              style={styles.logo}
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        )}

        <div style={styles.name}>{team.name}</div>

        {(team.primaryColor || team.secondaryColor) && (
          <>
            <div style={styles.colorsContainer}>
              {team.primaryColor && (
                <div
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: team.primaryColor,
                  }}
                  title={`Couleur principale: ${team.primaryColor}`}
                />
              )}
              {team.secondaryColor && (
                <div
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: team.secondaryColor,
                  }}
                  title={`Couleur secondaire: ${team.secondaryColor}`}
                />
              )}
            </div>
            <div style={styles.gradientPreview} />
          </>
        )}

        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <BarChart2 size={16} />
            {team.matchCount || 0} matchs
          </div>
          {/* Ajoutez d'autres statistiques ici */}
        </div>
      </div>
    </div>
  );
}
