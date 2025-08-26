// ==================== REPORTER EVENTS PAGE ====================
// front-admin/src/pages/reporter/EventsManagement.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMatches, addMatchEvent } from "../../services/api";
import {
  Play,
  Pause,
  Plus,
  Target,
  AlertTriangle,
  Users,
  Clock,
} from "lucide-react";
import { styles } from "./styles";

const EventsManagement = () => {
  const { user } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    type: "",
    teamId: "",
    player: "",
    minute: "",
  });

  useEffect(() => {
    loadLiveMatches();
  }, []);

  const loadLiveMatches = async () => {
    try {
      const response = await getMatches({
        reporterId: user?.id,
        status: "live",
      });

      setLiveMatches(response.data);

      if (response.data.length > 0) {
        setSelectedMatch(response.data[0]);
        loadMatchEvents(response.data[0].id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matchs en cours:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchEvents = async (matchId) => {
    try {
      // Charger les événements du match depuis l'API
      // Pour l'instant, on utilise des données mockées
      setEvents([
        {
          id: 1,
          type: "goal",
          teamId: selectedMatch?.homeTeam.id,
          player: "Jean Dupont",
          minute: 15,
          timestamp: new Date(),
        },
        {
          id: 2,
          type: "yellow_card",
          teamId: selectedMatch?.awayTeam.id,
          player: "Pierre Martin",
          minute: 23,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    if (
      !selectedMatch ||
      !newEvent.type ||
      !newEvent.teamId ||
      !newEvent.player ||
      !newEvent.minute
    ) {
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        matchId: selectedMatch.id,
        minute: parseInt(newEvent.minute),
      };

      await addMatchEvent(eventData);

      // Ajouter l'événement à la liste locale
      const newEventWithId = {
        ...eventData,
        id: Date.now(),
        timestamp: new Date(),
      };

      setEvents([...events, newEventWithId]);

      // Réinitialiser le formulaire
      setNewEvent({
        type: "",
        teamId: "",
        player: "",
        minute: "",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'événement:", error);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "goal":
        return <Target size={16} />;
      case "yellow_card":
        return <AlertTriangle size={16} style={{ color: "#facc15" }} />;
      case "red_card":
        return <AlertTriangle size={16} style={{ color: "#ef4444" }} />;
      case "substitution":
        return <Users size={16} />;
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Chargement des événements...</div>
      </div>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Play size={48} style={styles.emptyIcon} />
        <h3>Aucun match en cours</h3>
        <p>Il n'y a actuellement aucun match en direct à gérer</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion des Événements</h1>
        <p style={styles.subtitle}>Saisie des événements en temps réel</p>
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
              if (match) loadMatchEvents(match.id);
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

      {/* Informations du match */}
      {selectedMatch && (
        <div style={styles.matchInfo}>
          <div style={styles.matchHeader}>
            <div style={styles.matchTeams}>
              <span>{selectedMatch.homeTeam.name}</span>
              <div style={styles.matchScore}>
                {selectedMatch.homeScore} - {selectedMatch.awayScore}
              </div>
              <span>{selectedMatch.awayTeam.name}</span>
            </div>
            <div style={styles.matchStatus}>
              <div style={styles.liveIndicator}>
                <div style={styles.liveDot}></div>
                LIVE
              </div>
              <div style={styles.currentTime}>
                {selectedMatch.currentMinute || 0}'
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
                <label style={styles.label}>Type d'événement</label>
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
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Équipe</label>
                <select
                  value={newEvent.teamId}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, teamId: e.target.value })
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
                <input
                  type="text"
                  value={newEvent.player}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, player: e.target.value })
                  }
                  style={styles.input}
                  placeholder="Nom du joueur"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Minute</label>
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

            <button type="submit" style={styles.addButton}>
              <Plus size={16} />
              Ajouter l'événement
            </button>
          </form>
        </div>

        {/* Liste des événements */}
        <div style={styles.eventsList}>
          <h2 style={styles.sectionTitle}>Événements du Match</h2>

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
                      <div style={styles.eventPlayer}>{event.player}</div>
                      <div style={styles.eventTeam}>
                        {selectedMatch?.homeTeam.id === parseInt(event.teamId)
                          ? selectedMatch.homeTeam.name
                          : selectedMatch?.awayTeam.name}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div style={styles.noEvents}>
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
