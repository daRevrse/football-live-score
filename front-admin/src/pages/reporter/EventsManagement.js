import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getMatches,
  getMatchEvents,
  addMatchEvent,
  getTeamPlayers,
  updateScore,
  getMatch,
} from "../../services/api";
import {
  Play,
  Pause,
  Plus,
  Target,
  AlertTriangle,
  Users,
  Clock,
  RefreshCw,
  Save,
} from "lucide-react";
import socket from "../../services/socket";
import { styles } from "../../styles/common";
// import { styles } from './styles';

const EventsManagement = () => {
  const { user } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    type: "",
    teamId: "",
    playerId: "",
    playerName: "",
    minute: "",
  });

  useEffect(() => {
    loadLiveMatches();

    // Socket listeners pour les mises à jour temps réel
    socket.on("matchUpdated", handleMatchUpdate);
    socket.on("eventAdded", handleEventAdded);

    return () => {
      socket.off("matchUpdated");
      socket.off("eventAdded");
    };
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      loadMatchData();
      socket.emit("joinMatch", selectedMatch.id);

      return () => {
        socket.emit("leaveMatch", selectedMatch.id);
      };
    }
  }, [selectedMatch]);

  const loadLiveMatches = async () => {
    try {
      setLoading(true);

      // Récupérer tous les matchs assignés au reporter
      const response = await getMatches({
        reporterId: user?.id,
        status: ["live", "first_half", "second_half", "paused"],
      });

      const matches = response.data || [];
      setLiveMatches(matches);

      if (matches.length > 0 && !selectedMatch) {
        setSelectedMatch(matches[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matchs en cours:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchData = async () => {
    if (!selectedMatch) return;

    try {
      const [eventsResponse, homePlayersResponse, awayPlayersResponse] =
        await Promise.all([
          getMatchEvents(selectedMatch.id),
          getTeamPlayers(selectedMatch.homeTeam.id),
          getTeamPlayers(selectedMatch.awayTeam.id),
        ]);

      setEvents(eventsResponse.data || []);
      setHomePlayers(homePlayersResponse.data || []);
      setAwayPlayers(awayPlayersResponse.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des données du match:", error);
    }
  };

  const handleMatchUpdate = (updatedMatch) => {
    if (selectedMatch && updatedMatch.id === selectedMatch.id) {
      setSelectedMatch((prev) => ({ ...prev, ...updatedMatch }));
    }
  };

  const handleEventAdded = (newEvent) => {
    if (selectedMatch && newEvent.matchId === selectedMatch.id) {
      setEvents((prev) => [...prev, newEvent]);

      // Mettre à jour le score si c'est un but
      if (newEvent.type === "goal") {
        const isHomeTeam = newEvent.teamId === selectedMatch.homeTeam.id;
        setSelectedMatch((prev) => ({
          ...prev,
          homeScore: isHomeTeam ? prev.homeScore + 1 : prev.homeScore,
          awayScore: !isHomeTeam ? prev.awayScore + 1 : prev.awayScore,
        }));
      }
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    if (
      !selectedMatch ||
      !newEvent.type ||
      !newEvent.teamId ||
      !newEvent.minute
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);

    try {
      const eventData = {
        type: newEvent.type,
        teamId: parseInt(newEvent.teamId),
        playerId: newEvent.playerId ? parseInt(newEvent.playerId) : null,
        playerName: newEvent.playerName || "Joueur inconnu",
        minute: parseInt(newEvent.minute),
        matchId: selectedMatch.id,
      };

      const response = await addMatchEvent(selectedMatch.id, eventData);

      // L'événement sera ajouté via socket, pas besoin de l'ajouter manuellement

      // Si c'est un but, mettre à jour le score
      if (newEvent.type === "goal") {
        const isHomeTeam = newEvent.teamId == selectedMatch.homeTeam.id;
        const newHomeScore = isHomeTeam
          ? selectedMatch.homeScore + 1
          : selectedMatch.homeScore;
        const newAwayScore = !isHomeTeam
          ? selectedMatch.awayScore + 1
          : selectedMatch.awayScore;

        await updateScore(selectedMatch.id, newHomeScore, newAwayScore);
      }

      // Réinitialiser le formulaire
      setNewEvent({
        type: "",
        teamId: "",
        playerId: "",
        playerName: "",
        minute: "",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'événement:", error);
      alert("Erreur lors de l'ajout de l'événement");
    } finally {
      setSaving(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "goal":
        return <Target size={16} style={{ color: "#16a34a" }} />;
      case "yellow_card":
        return <AlertTriangle size={16} style={{ color: "#eab308" }} />;
      case "red_card":
        return <AlertTriangle size={16} style={{ color: "#ef4444" }} />;
      case "substitution":
        return <Users size={16} style={{ color: "#3b82f6" }} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getEventLabel = (type) => {
    switch (type) {
      case "goal":
        return "But";
      case "yellow_card":
        return "Carton jaune";
      case "red_card":
        return "Carton rouge";
      case "substitution":
        return "Remplacement";
      default:
        return type;
    }
  };

  const getTeamPlayers = (teamId) => {
    return teamId == selectedMatch?.homeTeam.id ? homePlayers : awayPlayers;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="animate-spin" size={24} />
        <div>Chargement des matchs en cours...</div>
      </div>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Play size={48} style={styles.emptyIcon} />
        <h3>Aucun match en cours</h3>
        <p>
          Il n'y a actuellement aucun match en direct assigné à votre compte
        </p>
        <button onClick={loadLiveMatches} style={styles.refreshButton}>
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion des Événements - Live</h1>
        <p style={styles.subtitle}>Reporter: {user?.username}</p>
      </div>

      {/* Sélection du match */}
      {liveMatches.length > 1 && (
        <div style={styles.matchSelector}>
          <label style={styles.selectorLabel}>Match en cours :</label>
          <select
            value={selectedMatch?.id || ""}
            onChange={(e) => {
              const match = liveMatches.find(
                (m) => m.id === parseInt(e.target.value)
              );
              setSelectedMatch(match);
            }}
            style={styles.selector}
          >
            {liveMatches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.homeTeam.name} vs {match.awayTeam.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Informations du match avec logos */}
      {selectedMatch && (
        <div style={styles.matchInfo}>
          <div style={styles.matchHeader}>
            <div style={styles.matchTeams}>
              <div style={styles.teamSection}>
                {selectedMatch.homeTeam.logo && (
                  <img
                    src={`${
                      process.env.REACT_APP_API_URL || "http://localhost:5000"
                    }/uploads/${selectedMatch.homeTeam.logo}`}
                    alt={selectedMatch.homeTeam.name}
                    style={styles.teamLogo}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <span style={styles.teamName}>
                  {selectedMatch.homeTeam.name}
                </span>
              </div>

              <div style={styles.matchScore}>
                <span style={styles.scoreNumber}>
                  {selectedMatch.homeScore}
                </span>
                <span style={styles.scoreSeparator}>-</span>
                <span style={styles.scoreNumber}>
                  {selectedMatch.awayScore}
                </span>
              </div>

              <div style={styles.teamSection}>
                {selectedMatch.awayTeam.logo && (
                  <img
                    src={`${
                      process.env.REACT_APP_API_URL || "http://localhost:5000"
                    }/uploads/${selectedMatch.awayTeam.logo}`}
                    alt={selectedMatch.awayTeam.name}
                    style={styles.teamLogo}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <span style={styles.teamName}>
                  {selectedMatch.awayTeam.name}
                </span>
              </div>
            </div>

            <div style={styles.matchStatus}>
              <div style={styles.liveIndicator}>
                <div style={styles.liveDot}></div>
                LIVE
              </div>
              <div style={styles.currentTime}>
                {selectedMatch.currentMinute || 0}'
              </div>
              <div style={styles.matchStatusText}>
                {selectedMatch.status === "first_half"
                  ? "1ère mi-temps"
                  : selectedMatch.status === "second_half"
                  ? "2ème mi-temps"
                  : selectedMatch.status === "paused"
                  ? "Pause"
                  : "En cours"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.mainContent}>
        {/* Formulaire d'ajout d'événement */}
        <div style={styles.eventForm}>
          <h2 style={styles.sectionTitle}>Ajouter un Événement</h2>

          <form onSubmit={handleAddEvent} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type d'événement *</label>
                <select
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value })
                  }
                  style={styles.input}
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="goal">But</option>
                  <option value="yellow_card">Carton jaune</option>
                  <option value="red_card">Carton rouge</option>
                  <option value="substitution">Remplacement</option>
                  <option value="corner">Corner</option>
                  <option value="offside">Hors-jeu</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Équipe *</label>
                <select
                  value={newEvent.teamId}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      teamId: e.target.value,
                      playerId: "",
                      playerName: "",
                    })
                  }
                  style={styles.input}
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value={selectedMatch?.homeTeam.id}>
                    {selectedMatch?.homeTeam.name}
                  </option>
                  <option value={selectedMatch?.awayTeam.id}>
                    {selectedMatch?.awayTeam.name}
                  </option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Joueur</label>
                <select
                  value={newEvent.playerId}
                  onChange={(e) => {
                    const player = getTeamPlayers(newEvent.teamId).find(
                      (p) => p.id == e.target.value
                    );
                    setNewEvent({
                      ...newEvent,
                      playerId: e.target.value,
                      playerName: player ? player.name : "",
                    });
                  }}
                  style={styles.input}
                  disabled={!newEvent.teamId}
                >
                  <option value="">Sélectionner un joueur...</option>
                  {getTeamPlayers(newEvent.teamId).map((player) => (
                    <option key={player.id} value={player.id}>
                      #{player.jerseyNumber} {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Minute *</label>
                <input
                  type="number"
                  value={newEvent.minute}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, minute: e.target.value })
                  }
                  style={styles.input}
                  min="0"
                  max="120"
                  required
                />
              </div>
            </div>

            <button type="submit" style={styles.addButton} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Ajouter l'événement
                </>
              )}
            </button>
          </form>
        </div>

        {/* Liste des événements */}
        <div style={styles.eventsList}>
          <h2 style={styles.sectionTitle}>
            Événements du Match ({events.length})
          </h2>

          <div style={styles.eventsContainer}>
            {events.length > 0 ? (
              events
                .sort((a, b) => b.minute - a.minute)
                .map((event) => (
                  <div key={event.id} style={styles.eventItem}>
                    <div style={styles.eventTime}>{event.minute}'</div>
                    <div style={styles.eventIcon}>
                      {getEventIcon(event.type)}
                    </div>
                    <div style={styles.eventDetails}>
                      <div style={styles.eventType}>
                        {getEventLabel(event.type)}
                      </div>
                      <div style={styles.eventPlayer}>
                        {event.playerName ||
                          event.player?.name ||
                          "Joueur inconnu"}
                      </div>
                      <div style={styles.eventTeam}>
                        {selectedMatch?.homeTeam.id === event.teamId
                          ? selectedMatch.homeTeam.name
                          : selectedMatch?.awayTeam.name}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div style={styles.noEvents}>
                <Clock
                  size={48}
                  style={{ color: "#9ca3af", marginBottom: "16px" }}
                />
                <p>Aucun événement enregistré pour ce match</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { EventsManagement };
