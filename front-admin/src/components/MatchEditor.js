import React, { useState, useEffect } from "react";
import {
  updateScore,
  startMatch,
  finishMatch,
  pauseMatch,
  resumeMatch,
  startSecondHalf,
  setAdditionalTime,
  getMatchEvents,
  addMatchEvent,
  getMatch,
} from "../services/api";
import io from "socket.io-client";
import {
  Users,
  X,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  RefreshCw,
  Play,
  Pause,
  FastForward,
  Edit,
  Save,
  AlertCircle,
  ChevronRight,
  Ban,
} from "lucide-react";
import { message } from "antd";
import { useAuth } from "../context/AuthContext";

// Connexion Socket.IO
const socket = io("http://localhost:5000");

export default function MatchEditor({
  match: initialMatch,
  onClose,
  onUpdate,
}) {
  const [match, setMatch] = useState(initialMatch);
  const [scores, setScores] = useState({
    home: initialMatch.homeScore || 0,
    away: initialMatch.awayScore || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventType, setEventType] = useState("home_goal");
  const [eventMinute, setEventMinute] = useState("");
  const [eventPlayer, setEventPlayer] = useState("");
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const [timerState, setTimerState] = useState({
    currentMinute: initialMatch.currentMinute || 0,
    currentSecond: initialMatch.currentSecond || 0,
    isRunning: initialMatch.status === "live",
    additionalTimeFirstHalf: initialMatch.additionalTimeFirstHalf || 0,
    additionalTimeSecondHalf: initialMatch.additionalTimeSecondHalf || 0,
  });

  const [additionalTimeInput, setAdditionalTimeInput] = useState({
    half: 1,
    minutes: 0,
  });

  // Styles CSS intégrés
  const styles = {
    container: {
      backgroundColor: "white",
      padding: "24px",
      width: "100%",
      maxWidth: "1000px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "8px",
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
    timerContainer: {
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timerText: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1e40af",
    },
    timerPeriod: {
      color: "#64748b",
      fontSize: "14px",
    },
    progressBar: {
      height: "8px",
      borderRadius: "4px",
      backgroundColor: "#e2e8f0",
      marginTop: "8px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3b82f6",
    },
    matchInfo: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "16px",
      color: "#64748b",
    },
    scoreContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "24px",
      marginBottom: "24px",
    },
    teamContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    },
    teamName: {
      fontSize: "18px",
      fontWeight: "600",
    },
    scoreInput: {
      width: "80px",
      fontSize: "24px",
      textAlign: "center",
      padding: "8px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
    },
    divider: {
      color: "#64748b",
      fontWeight: "bold",
    },
    actions: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      flexWrap: "wrap",
    },
    button: {
      padding: "10px 16px",
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
      backgroundColor: "#f1f5f9",
      color: "#334155",
    },
    buttonDanger: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
    },
    buttonSuccess: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    buttonWarning: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    },
    buttonDisabled: {
      opacity: "0.7",
      cursor: "not-allowed",
    },
    eventsContainer: {
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      padding: "16px",
    },
    eventsHeader: {
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    eventForm: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "16px",
    },
    eventInput: {
      padding: "8px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
    },
    eventList: {
      maxHeight: "300px",
      overflowY: "auto",
    },
    eventItem: {
      display: "flex",
      alignItems: "center",
      padding: "8px",
      borderRadius: "6px",
      backgroundColor: "white",
      marginBottom: "8px",
    },
    eventMinute: {
      fontWeight: "bold",
      marginRight: "8px",
    },
    eventPlayer: {
      flex: 1,
    },
    eventType: {
      fontSize: "12px",
      color: "#64748b",
    },
    additionalTimeContainer: {
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      padding: "16px",
      marginTop: "16px",
    },
    statusTag: {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
    },
    statusLive: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
    },
    statusPaused: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    statusFinished: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    statusScheduled: {
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
    },
  };

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await getMatchEvents(match.id);
        setEvents(res.data);
      } catch (err) {
        message.error("Erreur lors du chargement des événements");
      }
    };

    loadEvents();

    // Écouter les mises à jour du timer en temps réel
    socket.emit("joinMatch", match.id);

    const handleTimerUpdate = (data) => {
      if (data.matchId === match.id) {
        setTimerState((prev) => ({
          ...prev,
          currentMinute: data.currentMinute,
          currentSecond: data.currentSecond,
          isRunning: data.status === "live",
        }));
      }
    };

    const handleMatchUpdate = (updatedMatch) => {
      if (updatedMatch.id === match.id) {
        setMatch(updatedMatch);
        setScores({
          home: updatedMatch.homeScore || 0,
          away: updatedMatch.awayScore || 0,
        });
      }
    };

    const handleMatchEvent = (payload) => {
      if (payload.match && payload.match.id === match.id) {
        setMatch(payload.match);
        setScores({
          home: payload.match.homeScore || 0,
          away: payload.match.awayScore || 0,
        });
        // Recharger les événements
        loadEvents();
      }
    };

    socket.on("match:timer", handleTimerUpdate);
    socket.on("match_updated", handleMatchUpdate);
    socket.on("match:event", handleMatchEvent);
    socket.on("match:started", () => message.success("Match démarré"));
    socket.on("match:paused", () => message.info("Match mis en pause"));
    socket.on("match:resumed", () => message.success("Match repris"));
    socket.on("match:finished", () => message.success("Match terminé"));
    socket.on("match:second_half_started", () =>
      message.success("Seconde mi-temps démarrée")
    );

    return () => {
      socket.emit("leaveMatch", match.id);
      socket.off("match:timer", handleTimerUpdate);
      socket.off("match_updated", handleMatchUpdate);
      socket.off("match:event", handleMatchEvent);
      socket.off("match:started");
      socket.off("match:paused");
      socket.off("match:resumed");
      socket.off("match:finished");
      socket.off("match:second_half_started");
    };
  }, [match.id]);

  const handleScoreChange = (team, value) => {
    setScores((prev) => ({ ...prev, [team]: value }));
  };

  const saveScore = async () => {
    try {
      setLoading(true);
      const response = await updateScore(match.id, scores.home, scores.away);
      setMatch((prev) => ({
        ...prev,
        homeScore: scores.home,
        awayScore: scores.away,
      }));
      message.success("Score mis à jour");
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors de la mise à jour du score");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    try {
      setLoading(true);
      const response = await startMatch(match.id);
      setMatch(response.data);
      setTimerState((prev) => ({ ...prev, isRunning: true }));
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors du démarrage du match");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseMatch = async () => {
    try {
      setLoading(true);
      await pauseMatch(match.id);
      setMatch((prev) => ({ ...prev, status: "paused" }));
      setTimerState((prev) => ({ ...prev, isRunning: false }));
    } catch (err) {
      message.error("Erreur lors de la pause du match");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeMatch = async () => {
    try {
      setLoading(true);
      await resumeMatch(match.id);
      setMatch((prev) => ({ ...prev, status: "live" }));
      setTimerState((prev) => ({ ...prev, isRunning: true }));
    } catch (err) {
      message.error("Erreur lors de la reprise du match");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSecondHalf = async () => {
    try {
      setLoading(true);
      await startSecondHalf(match.id);
      setMatch((prev) => ({ ...prev, status: "live" }));
      setTimerState((prev) => ({ ...prev, isRunning: true }));
    } catch (err) {
      message.error("Erreur lors du démarrage de la seconde mi-temps");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishMatch = async () => {
    try {
      setLoading(true);
      const response = await finishMatch(match.id);
      setMatch(response.data);
      setTimerState((prev) => ({ ...prev, isRunning: false }));
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      message.error("Erreur lors de la fin du match");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAdditionalTime = async () => {
    try {
      setLoading(true);
      await setAdditionalTime(
        match.id,
        additionalTimeInput.half,
        additionalTimeInput.minutes
      );
      const field =
        additionalTimeInput.half === 1
          ? "additionalTimeFirstHalf"
          : "additionalTimeSecondHalf";
      setTimerState((prev) => ({
        ...prev,
        [field]: additionalTimeInput.minutes,
      }));
      message.success(
        `Temps additionnel défini: ${additionalTimeInput.minutes} min`
      );
    } catch (err) {
      message.error("Erreur lors de la définition du temps additionnel");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    // if (!eventMinute || isNaN(eventMinute)) {
    //   message.warning("Veuillez entrer une minute valide");
    //   return;
    // }

    if (!eventPlayer.trim()) {
      message.warning("Veuillez entrer le nom du joueur");
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        type: eventType,
        teamId: eventType.includes("home")
          ? match.homeTeam.id
          : match.awayTeam.id,
        player: eventPlayer,
        minute: parseInt(eventMinute ? eventMinute : timerState.currentMinute),
      };

      await addMatchEvent(match.id, eventData);
      message.success("Événement ajouté");
      setEventMinute("");
      setEventPlayer("");

      // Recharger les événements et le match
      const [eventsRes, matchRes] = await Promise.all([
        getMatchEvents(match.id),
        getMatch(match.id),
      ]);

      setEvents(eventsRes.data);
      setScores({
        home: matchRes.data.homeScore || 0,
        away: matchRes.data.awayScore || 0,
      });
    } catch (err) {
      // message.error("Erreur lors de l'ajout de l'événement");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = () => {
    const baseStyle = styles.statusTag;
    switch (match.status) {
      case "live":
        return (
          <span style={{ ...baseStyle, ...styles.statusLive }}>En cours</span>
        );
      case "paused":
        return (
          <span style={{ ...baseStyle, ...styles.statusPaused }}>En pause</span>
        );
      case "finished":
        return (
          <span style={{ ...baseStyle, ...styles.statusFinished }}>
            Terminé
          </span>
        );
      default:
        return (
          <span style={{ ...baseStyle, ...styles.statusScheduled }}>
            À venir
          </span>
        );
    }
  };

  const formatTime = () => {
    const { currentMinute, currentSecond } = timerState;
    const minutes = String(currentMinute).padStart(2, "0");
    const seconds = String(currentSecond).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getMatchPeriod = () => {
    const { currentMinute } = timerState;
    if (currentMinute < 45) return "1ère mi-temps";
    if (currentMinute === 45) return "Temps additionnel 1ère MT";
    if (currentMinute < 90) return "2ème mi-temps";
    return "Temps additionnel 2ème MT";
  };

  const getProgressPercent = () => {
    const { currentMinute } = timerState;
    return Math.min((currentMinute / 90) * 100, 100);
  };

  if (user.role === "Reporter" && match.reporterId !== user.id) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <AlertCircle
          size={48}
          style={{ color: "#ef4444", marginBottom: "16px" }}
        />
        <h3>Accès non autorisé</h3>
        <p>Vous n'êtes pas assigné à ce match.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <Trophy size={20} />
          Contrôle du match
        </h2>
        <div>
          {getStatusTag()}
          {/* {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                marginLeft: "16px",
              }}
            >
              <X size={20} />
            </button>
          )} */}
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Timer */}
      {match.status !== "scheduled" && (
        <div style={styles.timerContainer}>
          <div>
            <div style={styles.timerText}>{formatTime()}</div>
            <div style={styles.timerPeriod}>{getMatchPeriod()}</div>
          </div>
          <div style={{ width: "200px" }}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${getProgressPercent()}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Informations du match */}
      <div style={styles.matchInfo}>
        <Calendar size={16} />
        <span>{new Date(match.startAt).toLocaleString()}</span>
        <ChevronRight size={16} />
        <MapPin size={16} />
        <span>{match.location || "Lieu non spécifié"}</span>
      </div>

      {/* Score */}
      <div style={styles.scoreContainer}>
        <div style={styles.teamContainer}>
          <div style={styles.teamName}>
            {match.homeTeam?.name || "Équipe domicile"}
          </div>
          <input
            type="number"
            min="0"
            value={scores.home}
            onChange={(e) =>
              handleScoreChange("home", parseInt(e.target.value) || 0)
            }
            disabled={match.status !== "live"}
            style={styles.scoreInput}
          />
        </div>

        <div style={styles.divider}>VS</div>

        <div style={styles.teamContainer}>
          <div style={styles.teamName}>
            {match.awayTeam?.name || "Équipe extérieure"}
          </div>
          <input
            type="number"
            min="0"
            value={scores.away}
            onChange={(e) =>
              handleScoreChange("away", parseInt(e.target.value) || 0)
            }
            disabled={match.status !== "live"}
            style={styles.scoreInput}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        {match.status === "scheduled" && (
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleStartMatch}
            disabled={isLoading}
            onMouseEnter={(e) =>
              !isLoading && Object.assign(e.target.style, styles.buttonHover)
            }
            onMouseLeave={(e) => {
              e.target.style.transform = "none";
              e.target.style.boxShadow = "none";
            }}
          >
            <Play size={16} />
            Démarrer le match
          </button>
        )}

        {match.status === "live" && (
          <>
            <button
              style={{ ...styles.button, ...styles.buttonSuccess }}
              onClick={saveScore}
              disabled={isLoading}
            >
              <Save size={16} />
              Sauvegarder le score
            </button>

            <button
              style={{ ...styles.button, ...styles.buttonWarning }}
              onClick={handlePauseMatch}
              disabled={isLoading}
            >
              <Pause size={16} />
              Pause
            </button>

            {timerState.currentMinute >= 45 &&
              timerState.currentMinute < 50 && (
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={handleStartSecondHalf}
                  disabled={isLoading}
                >
                  <FastForward size={16} />
                  2ème mi-temps
                </button>
              )}

            <button
              style={{ ...styles.button, ...styles.buttonDanger }}
              onClick={() => {
                if (
                  window.confirm("Êtes-vous sûr de vouloir terminer le match ?")
                ) {
                  handleFinishMatch();
                }
              }}
              disabled={isLoading}
            >
              <Ban size={16} />
              Terminer
            </button>
          </>
        )}

        {match.status === "paused" && (
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleResumeMatch}
            disabled={isLoading}
          >
            <Play size={16} />
            Reprendre
          </button>
        )}
      </div>

      {/* Événements et temps additionnel */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        <div style={styles.eventsContainer}>
          <h3 style={styles.eventsHeader}>
            <Edit size={16} />
            Événements du match
          </h3>

          {match.status === "live" && (
            <div style={styles.eventForm}>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={styles.eventInput}
              >
                <option value="home_goal">⚽ But domicile</option>
                <option value="away_goal">⚽ But extérieur</option>
                <option value="yellow_card">🟨 Carton jaune</option>
                <option value="red_card">🟥 Carton rouge</option>
                <option value="substitution">🔄 Remplacement</option>
              </select>

              <input
                type="number"
                placeholder="Minute"
                value={eventMinute}
                onChange={(e) => setEventMinute(e.target.value)}
                min="0"
                max="120"
                style={styles.eventInput}
              />

              <input
                type="text"
                placeholder="Joueur"
                value={eventPlayer}
                onChange={(e) => setEventPlayer(e.target.value)}
                style={styles.eventInput}
              />

              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={addEvent}
                disabled={isLoading}
              >
                Ajouter
              </button>
            </div>
          )}

          <div style={styles.eventList}>
            {events.length > 0 ? (
              events
                .sort((a, b) => b.minute - a.minute)
                .map((event, index) => (
                  <div key={index} style={styles.eventItem}>
                    <div style={styles.eventMinute}>{event.minute}'</div>
                    <div style={styles.eventPlayer}>
                      {event.player}
                      <div style={styles.eventType}>
                        {event.type.replace("_", " ")}
                      </div>
                    </div>
                    <div>
                      {event.type === "home_goal" || event.type === "away_goal"
                        ? "⚽"
                        : event.type === "yellow_card"
                        ? "🟨"
                        : event.type === "red_card"
                        ? "🟥"
                        : "🔄"}
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ color: "#64748b", textAlign: "center" }}>
                Aucun événement enregistré
              </div>
            )}
          </div>
        </div>

        <div style={styles.additionalTimeContainer}>
          <h3 style={styles.eventsHeader}>
            <Clock size={16} />
            Temps additionnel
          </h3>

          {match.status === "live" && (
            <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
              <select
                value={additionalTimeInput.half}
                onChange={(e) =>
                  setAdditionalTimeInput((prev) => ({
                    ...prev,
                    half: parseInt(e.target.value),
                  }))
                }
                style={styles.eventInput}
              >
                <option value={1}>1ère mi-temps</option>
                <option value={2}>2ème mi-temps</option>
              </select>

              <input
                type="number"
                placeholder="Minutes"
                value={additionalTimeInput.minutes}
                onChange={(e) =>
                  setAdditionalTimeInput((prev) => ({
                    ...prev,
                    minutes: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                max="15"
                style={styles.eventInput}
              />

              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={handleSetAdditionalTime}
                disabled={isLoading}
              >
                Définir
              </button>
            </div>
          )}

          <div>
            <div style={{ marginBottom: "8px" }}>
              <strong>1ère mi-temps:</strong> +
              {timerState.additionalTimeFirstHalf} min
            </div>
            <div>
              <strong>2ème mi-temps:</strong> +
              {timerState.additionalTimeSecondHalf} min
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
