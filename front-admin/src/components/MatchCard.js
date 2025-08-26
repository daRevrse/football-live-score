import React, { useState, useEffect } from "react";
import { Clock, Flag, Edit, Trash2 } from "lucide-react";
import io from "socket.io-client";
import AssignReporter from "./AssignReporter";
import { useAuth } from "../context/AuthContext";

// Connexion Socket.IO
const socket = io("http://localhost:5000");

const MatchCard = ({ match, onEdit, onDelete, styles, onAssign }) => {
  const [timerState, setTimerState] = useState({
    currentMinute: match.currentMinute || 0,
    currentSecond: match.currentSecond || 0,
    isRunning: match.status === "live",
  });

  const { user } = useAuth();

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "finished":
        return { backgroundColor: "#166534", color: "#fff" };
      case "live":
        return { backgroundColor: "#ef4444", color: "#fff" };
      case "scheduled":
        return { backgroundColor: "#1e40af", color: "#fff" };
      default:
        return { backgroundColor: "#4b5563", color: "#fff" };
    }
  };

  // Formatage du temps (00:00)
  const formatTime = () => {
    const { currentMinute, currentSecond } = timerState;
    const minutes = String(currentMinute).padStart(2, "0");
    const seconds = String(currentSecond).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    // Rejoindre la room du match pour recevoir les updates
    socket.emit("joinMatch", match.id);

    const handleTimerUpdate = (data) => {
      if (data.matchId === match.id) {
        setTimerState({
          currentMinute: data.currentMinute,
          currentSecond: data.currentSecond,
          isRunning: data.status === "live",
        });
      }
    };

    socket.on("match:timer", handleTimerUpdate);

    return () => {
      socket.emit("leaveMatch", match.id);
      socket.off("match:timer", handleTimerUpdate);
    };
  }, [match.id]);

  return (
    <div
      style={styles.matchCard}
      onMouseEnter={(e) =>
        Object.assign(e.currentTarget.style, styles.matchCardHover)
      }
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
      }}
    >
      <div style={styles.matchHeader}>
        <div style={styles.teamsContainer}>
          <div style={styles.teamWithLogo}>
            {match.homeTeam?.logoUrl ? (
              <img
                src={match.homeTeam.logoUrl}
                alt={match.homeTeam.name}
                style={styles.teamLogo}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "inline";
                }}
              />
            ) : null}
            <span
              style={
                match.homeTeam?.logoUrl
                  ? styles.hiddenTeamName
                  : styles.teamName
              }
            >
              {match.homeTeam.name}
            </span>
          </div>
          <span style={styles.vsSeparator}>vs</span>
          <div style={styles.teamWithLogo}>
            {match.awayTeam?.logoUrl ? (
              <img
                src={match.awayTeam.logoUrl}
                alt={match.awayTeam.name}
                style={styles.teamLogo}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "inline";
                }}
              />
            ) : null}
            <span
              style={
                match.awayTeam?.logoUrl
                  ? styles.hiddenTeamName
                  : styles.teamName
              }
            >
              {match.awayTeam.name}
            </span>
          </div>
        </div>
        {match.status === "live" && (
          <span
            style={{
              marginRight: "5px",
              fontWeight: "bold",
              fontSize: "15px",
              color: "#ef4444",
            }}
          >
            {formatTime()}'
          </span>
        )}
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
          <div style={styles.matchInfoScoreRow}>
            <span style={{ fontWeight: "bold", fontSize: "35px" }}>
              {match.homeTeam.shortName}
            </span>

            <div style={styles.matchScore}>
              {match.homeScore} - {match.awayScore}
            </div>

            <span style={{ fontWeight: "bold", fontSize: "35px" }}>
              {match.awayTeam.shortName}
            </span>
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
        {user?.role === "Admin" && (
          <AssignReporter match={match} onAssign={onAssign} />
        )}
        <button
          style={{ ...styles.actionButton, ...styles.editButton }}
          onClick={() => onEdit(match.id)}
        >
          <Edit size={14} />
          Éditer
        </button>
        <button
          style={{ ...styles.actionButton, ...styles.deleteButton }}
          onClick={() => onDelete(match.id)}
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
