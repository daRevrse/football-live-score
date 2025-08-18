import React, { useEffect, useState } from "react";
import {
  Trophy,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  Flag,
} from "lucide-react";
import { getMatches, getTeams } from "../services/api";
import socket from "../services/socket";
import PublicMatchCard from "./PublicMatchCard";
import PublicMatchDetail from "./PublicMatchDetail";

// Styles CSS intégrés
const styles = {
  container: {
    padding: "24px",
    // background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    // maxWidth: "800px",
    maxHeight: "90vh",
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative",
    padding: "20px",
  },
  closeButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#64748b",
    ":hover": {
      color: "#334155",
    },
  },
};

export default function PublicMatchList() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

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

    const handleMatchUpdate = (updatedMatch) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
    };

    socket.on("match_updated", handleMatchUpdate);
    socket.on("match:event", (payload) => {
      if (payload?.match) handleMatchUpdate(payload.match);
    });

    return () => {
      socket.off("match_updated");
      socket.off("match:event");
    };
  }, []);

  const sortedMatches = [...matches].sort((a, b) => {
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
          {sortedMatches.map((match) => (
            <PublicMatchCard
              key={match.id}
              match={match}
              teams={teams}
              onClick={() => setSelectedMatch(match)}
            />
          ))}
        </div>
      )}

      {/* Modal PublicMatchDetail */}
      {selectedMatch && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              style={styles.closeButton}
              onClick={() => setSelectedMatch(null)}
            >
              &times;
            </button>
            <PublicMatchDetail
              match={selectedMatch}
              teams={teams}
              onClose={() => setSelectedMatch(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
