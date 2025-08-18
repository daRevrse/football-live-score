import React, { useState, useEffect } from "react";
import { Flame, Clock, Flag, CheckCircle2, PauseCircle } from "lucide-react";
import socket from "../services/socket";
import { useNavigate } from "react-router-dom";

const styles = {
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

const PublicMatchCard = ({ match, teams, onClick }) => {
  const navigate = useNavigate();
  const [timer, setTimer] = useState({
    minute: match.currentMinute || 0,
    second: match.currentSecond || 0,
  });

  useEffect(() => {
    if (match.status !== "live") return;

    socket.emit("joinMatch", match.id);

    const handleTimerUpdate = (data) => {
      if (data.matchId === match.id) {
        setTimer({
          minute: data.currentMinute,
          second: data.currentSecond,
        });
      }
    };

    socket.on("match:timer", handleTimerUpdate);

    return () => {
      socket.emit("leaveMatch", match.id);
      socket.off("match:timer", handleTimerUpdate);
    };
  }, [match.id, match.status]);

  const formatTime = () => {
    return `${String(timer.minute).padStart(2, "0")}:${String(
      timer.second
    ).padStart(2, "0")}`;
  };

  const handleMatchClick = () => {
    // navigate(`/match/${match.id}`);
    onClick();
  };

  const getStatusStyle = () => {
    switch (match.status?.toLowerCase()) {
      case "live":
        return {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          icon: <Flame size={16} />,
          text: `En direct (${timer.minute}')`,
        };
      case "finished":
        return {
          backgroundColor: "#f0fdf4",
          color: "#166534",
          icon: <CheckCircle2 size={16} />,
          text: "Terminé",
        };
      case "paused":
        return {
          backgroundColor: "#f0fdf4",
          color: "#866534",
          icon: <PauseCircle size={16} />,
          text: "En pause",
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

  const statusInfo = getStatusStyle();
  const isLive = match.status === "live";

  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Équipe inconnue";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleMatchClick();
    }
  };

  return (
    <div
      style={styles.matchCard}
      onClick={handleMatchClick}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      role="button"
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
          LIVE {formatTime()}
        </div>
      )}

      <div style={styles.matchHeader}>
        <div style={styles.matchDate}>
          <Clock size={14} />
          {new Date(match.startAt).toLocaleString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
            {match.homeTeam?.logoUrl && (
              <img
                src={match.homeTeam.logoUrl}
                alt={`Logo ${match.homeTeam.name}`}
                style={styles.logoImage}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <div style={styles.teamName}>
              {match.homeTeam?.name || getTeamName(match.homeTeamId)}
            </div>
            <div style={styles.teamScore}>{match.homeScore ?? 0}</div>
          </div>

          <div style={styles.vsSection}>
            <div style={styles.vsText}>VS</div>
            <div style={styles.vsDivider} />
          </div>

          <div style={styles.teamSection}>
            {match.awayTeam?.logoUrl && (
              <img
                src={match.awayTeam.logoUrl}
                alt={`Logo ${match.awayTeam.name}`}
                style={styles.logoImage}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <div style={styles.teamName}>
              {match.awayTeam?.name || getTeamName(match.awayTeamId)}
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
};

export default PublicMatchCard;
