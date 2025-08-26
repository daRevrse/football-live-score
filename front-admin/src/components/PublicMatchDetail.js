import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  Flag,
  Users,
  Award,
  AlertCircle,
  ChevronLeft,
  PauseCircle,
} from "lucide-react";
import { getMatch, getMatchEvents } from "../services/api";
import socket from "../services/socket";

const PublicMatchDetail = ({ match: initialMatch, onClose }) => {
  // const { matchId } = useParams();
  // const [match, setMatch] = useState(null);
  // const [events, setEvents] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [timer, setTimer] = useState({
  //   minute: 0,
  //   second: 0,
  //   isRunning: false,
  // });
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState([]);
  const [timer, setTimer] = useState({
    minute: initialMatch.currentMinute || 0,
    second: initialMatch.currentSecond || 0,
    isRunning: initialMatch.status === "live",
  });

  // useEffect(() => {
  //   const fetchMatchData = async () => {
  //     try {
  //       setLoading(true);
  //       const [matchRes, eventsRes] = await Promise.all([
  //         getMatch(matchId),
  //         getMatchEvents(matchId),
  //       ]);

  //       setMatch(matchRes.data);
  //       setEvents(eventsRes.data);
  //       setTimer({
  //         minute: matchRes.data.currentMinute || 0,
  //         second: matchRes.data.currentSecond || 0,
  //         isRunning: matchRes.data.status === "live",
  //       });

  //     } catch (err) {
  //       setError("Erreur de chargement du match");
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchMatchData();

  //   // Configuration des écouteurs Socket.IO
  //   socket.emit("joinMatch", matchId);

  //   const handleTimerUpdate = (data) => {
  //     if (data.matchId === matchId) {
  //       setTimer({
  //         minute: data.currentMinute,
  //         second: data.currentSecond,
  //         isRunning: data.status === "live",
  //       });

  //       setMatch((prev) => (prev ? { ...prev, status: data.status } : null));
  //     }
  //   };

  //   const handleMatchUpdate = (updatedMatch) => {
  //     if (updatedMatch.id === matchId) {
  //       setMatch(updatedMatch);
  //       setTimer({
  //         minute: updatedMatch.currentMinute || 0,
  //         second: updatedMatch.currentSecond || 0,
  //         isRunning: updatedMatch.status === "live",
  //       });
  //     }
  //   };

  //   const handleMatchEvent = (payload) => {
  //     if (payload?.match?.id === matchId) {
  //       setMatch(payload.match);
  //       setEvents((prev) => [...prev, payload.event]);
  //     }
  //   };

  //   socket.on("match:timer", handleTimerUpdate);
  //   socket.on("match_updated", handleMatchUpdate);
  //   socket.on("match:event", handleMatchEvent);

  //   return () => {
  //     socket.emit("leaveMatch", matchId);
  //     socket.off("match:timer", handleTimerUpdate);
  //     socket.off("match_updated", handleMatchUpdate);
  //     socket.off("match:event", handleMatchEvent);
  //   };
  // }, [matchId]);

  // Ajoutez aussi les keyframes CSS pour l'animation du spinner

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRes = await getMatchEvents(match.id);
        setEvents(eventsRes.data);
      } catch (err) {
        console.error("Erreur de chargement des événements", err);
      }
    };

    fetchEvents();

    // Gestion Socket.IO
    socket.emit("joinMatch", match.id);

    const handleTimerUpdate = (data) => {
      if (data.matchId === match.id) {
        setTimer({
          minute: data.currentMinute,
          second: data.currentSecond,
          isRunning: data.status === "live",
        });
        setMatch((prev) => ({ ...prev, status: data.status }));
      }
    };

    socket.on("match:timer", handleTimerUpdate);

    return () => {
      socket.emit("leaveMatch", match.id);
      socket.off("match:timer", handleTimerUpdate);
    };
  }, [match.id]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.querySelector(
        "style[data-timer-animation]"
      );
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Modifiez également la fonction getMatchPeriod pour une meilleure gestion
  const getMatchPeriod = () => {
    if (timer.minute === 0 && timer.second === 0) return "Match non commencé";
    if (timer.minute <= 45) return "1ère mi-temps";
    if (timer.minute > 45 && timer.minute <= 50)
      return "Temps additionnel 1ère mi-temps";
    if (timer.minute > 50 && timer.minute <= 90) return "2ème mi-temps";
    return "Temps additionnel 2ème mi-temps";
  };

  const formatTime = () => {
    return `${String(timer.minute).padStart(2, "0")}:${String(
      timer.second
    ).padStart(2, "0")}`;
  };

  // const getMatchPeriod = () => {
  //   if (!timer.minute) return "Match non commencé";
  //   if (timer.minute < 45) return "1ère mi-temps";
  //   if (timer.minute === 45) return "Temps additionnel 1ère mi-temps";
  //   if (timer.minute < 90) return "2ème mi-temps";
  //   return "Temps additionnel 2ème mi-temps";
  // };

  const getStatusInfo = () => {
    switch (match?.status?.toLowerCase()) {
      case "live":
        return {
          color: "#dc2626",
          icon: <Flame size={20} />,
          text: "En direct",
          bgColor: "#fef2f2",
        };
      case "finished":
        return {
          color: "#166534",
          icon: <CheckCircle2 size={20} />,
          text: "Terminé",
          bgColor: "#f0fdf4",
        };
      case "paused":
        return {
          color: "#866534",
          icon: <PauseCircle size={20} />,
          text: "En pause",
          bgColor: "#f0fdf4",
        };
      default:
        return {
          color: "#1e40af",
          icon: <Clock size={20} />,
          text: "À venir",
          bgColor: "#eff6ff",
        };
    }
  };

  // if (loading) {
  //   return (
  //     <div style={styles.loadingContainer}>
  //       <div style={styles.loadingSpinner}></div>
  //       <p>Chargement du match...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={styles.notFoundContainer}>
        <AlertCircle size={24} />
        <p>Match non trouvé</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {/* <button onClick={() => window.history.back()} style={styles.backButton}>
          <ChevronLeft size={20} />
          Retour
        </button> */}
        <h1 style={styles.title}>Détails du match</h1>
      </div>

      <div style={styles.matchHeader}>
        <div
          style={{
            ...styles.statusBadge,
            backgroundColor: statusInfo.bgColor,
            color: statusInfo.color,
          }}
        >
          {statusInfo.icon}
          {statusInfo.text}
          {match.status === "live" && ` (${timer.minute}')`}
        </div>

        <div style={styles.matchInfo}>
          <div style={styles.infoItem}>
            <Calendar size={16} />
            <span>
              {new Date(match.startAt).toLocaleString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div style={styles.infoItem}>
            <Flag size={16} />
            <span>{match.location || "Lieu non spécifié"}</span>
          </div>
        </div>
      </div>

      {match.status === "live" && (
        <div style={styles.timerContainer}>
          <div style={styles.timerDisplay}>
            <span style={styles.timerText}>{formatTime()}</span>
            <span style={styles.timerPeriod}>{getMatchPeriod()}</span>
          </div>
        </div>
      )}

      <div style={styles.teamsContainer}>
        <div style={styles.team}>
          <img
            src={match.homeTeam?.logoUrl}
            alt={match.homeTeam?.name}
            style={styles.teamLogo}
            onError={(e) => (e.target.style.display = "none")}
          />
          <h2 style={styles.teamName}>{match.homeTeam?.name}</h2>
          <div style={styles.teamScore}>{match.homeScore ?? 0}</div>
        </div>

        <div style={styles.vsContainer}>
          <div style={styles.vsText}>VS</div>
          {match.status === "live" && (
            <div style={styles.timerSmall}>{formatTime()}'</div>
          )}
        </div>

        <div style={styles.team}>
          <img
            src={match.awayTeam?.logoUrl}
            alt={match.awayTeam?.name}
            style={styles.teamLogo}
            onError={(e) => (e.target.style.display = "none")}
          />
          <h2 style={styles.teamName}>{match.awayTeam?.name}</h2>
          <div style={styles.teamScore}>{match.awayScore ?? 0}</div>
        </div>
      </div>

      <div style={styles.eventsContainer}>
        <h3 style={styles.sectionTitle}>
          <Award size={20} />
          Événements du match
        </h3>
        {events.length > 0 ? (
          <div style={styles.eventsList}>
            {events
              .sort((a, b) => b.minute - a.minute)
              .map((event, index) => (
                <div key={index} style={styles.eventItem}>
                  <div style={styles.eventMinute}>{event.minute}'</div>
                  <div style={styles.eventContent}>
                    <div style={styles.eventPlayer}>{event.player}</div>
                    <div style={styles.eventType}>
                      {event.type.replace("_", " ")}
                      {event.teamId === match.homeTeam?.id
                        ? " (Domicile)"
                        : " (Extérieur)"}
                    </div>
                  </div>
                  <div style={styles.eventIcon}>
                    {event.type.includes("goal")
                      ? "⚽"
                      : event.type.includes("yellow")
                      ? "🟨"
                      : event.type.includes("red")
                      ? "🟥"
                      : "🔄"}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div style={styles.noEvents}>Aucun événement enregistré</div>
        )}
      </div>
    </div>
  );
};

// Styles CSS intégrés
const styles = {
  container: {
    // maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    // backgroundColor: "#48f7fc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
    position: "relative",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#3b82f6",
    fontSize: "16px",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#e0f2fe",
    },
  },
  title: {
    textAlign: "center",
    flex: 1,
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  matchHeader: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "15px",
  },
  matchInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "14px",
  },
  timerContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  timerDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  timerText: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#1e40af",
  },
  timerPeriod: {
    color: "#64748b",
    fontSize: "14px",
  },
  teamsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "30px 20px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  team: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },
  teamLogo: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
  },
  teamName: {
    fontSize: "18px",
    fontWeight: "bold",
    textAlign: "center",
    margin: 0,
  },
  teamScore: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#1e40af",
  },
  vsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    margin: "0 20px",
  },
  vsText: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#64748b",
  },
  timerSmall: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#dc2626",
  },
  eventsContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  eventsList: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  eventItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    marginBottom: "10px",
  },
  eventMinute: {
    fontWeight: "bold",
    minWidth: "40px",
    color: "#1e40af",
  },
  eventContent: {
    flex: 1,
  },
  eventPlayer: {
    fontWeight: "500",
  },
  eventType: {
    fontSize: "12px",
    color: "#64748b",
  },
  eventIcon: {
    fontSize: "20px",
  },
  noEvents: {
    textAlign: "center",
    color: "#64748b",
    padding: "20px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "20px",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    height: "100vh",
    color: "#dc2626",
    fontWeight: "500",
  },
  notFoundContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    height: "100vh",
    color: "#64748b",
    fontWeight: "500",
  },
};

export default PublicMatchDetail;
