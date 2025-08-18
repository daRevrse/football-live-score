// src/screens/MatchDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import socket from "../services/socket";
import axios from "axios";

const { width } = Dimensions.get("window");
const API_URL = "http://192.168.1.75:5000";

export default function MatchDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔑 État local pour le timer (comme dans MatchItem)
  const [timer, setTimer] = useState({
    minute: 0,
    second: 0,
  });

  const fetchMatch = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    try {
      const response = await axios.get(`${API_URL}/matches/${id}`);
      setMatch(response.data);

      // 🔑 Initialiser le timer avec les données du match
      if (response.data) {
        setTimer({
          minute: response.data.currentMinute || 0,
          second: response.data.currentSecond || 0,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du match:", error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchMatch();

    // Rejoindre la room pour recevoir les mises à jour en temps réel
    console.log(`🔌 Joining match ${id} for detail updates`);
    socket.emit("joinMatch", id);

    // 🔑 Gestion des mises à jour timer (nouvelle)
    const onTimerUpdate = (data) => {
      if (!mounted || !data || String(data.matchId) !== String(id)) return;

      console.log(`⏱️ Timer update for match detail ${id}:`, data);
      setTimer({
        minute: data.currentMinute,
        second: data.currentSecond,
      });

      // Mettre à jour aussi le match pour le statut
      setMatch((prev) =>
        prev
          ? {
              ...prev,
              currentMinute: data.currentMinute,
              currentSecond: data.currentSecond,
              status: data.status,
            }
          : prev
      );
    };

    const onMatchEvent = (payload) => {
      if (!payload || !mounted) return;
      if (payload.match && String(payload.match.id) === String(id)) {
        console.log(
          `🔄 Match event update for ${id}:`,
          payload.match.events?.length || 0,
          "events"
        );
        setMatch(payload.match);

        // Mettre à jour le timer si disponible
        if (payload.match.currentMinute !== undefined) {
          setTimer({
            minute: payload.match.currentMinute || 0,
            second: payload.match.currentSecond || 0,
          });
        }
      }
    };

    const onMatchUpdated = (updated) => {
      if (!mounted) return;
      if (String(updated.id) === String(id)) {
        console.log(`🔄 Match updated for ${id}`);
        setMatch(updated);

        // Mettre à jour le timer si disponible
        if (updated.currentMinute !== undefined) {
          setTimer({
            minute: updated.currentMinute || 0,
            second: updated.currentSecond || 0,
          });
        }
      }
    };

    // 🔑 Ajout de l'écoute du timer
    socket.on("match:timer", onTimerUpdate);
    socket.on("match:event", onMatchEvent);
    socket.on("match_updated", onMatchUpdated);

    return () => {
      console.log(`🔌 Leaving match ${id}`);
      socket.emit("leaveMatch", id);
      socket.off("match:timer", onTimerUpdate);
      socket.off("match:event", onMatchEvent);
      socket.off("match_updated", onMatchUpdated);
      mounted = false;
    };
  }, [id]);

  // Fonction pour obtenir l'icône d'événement
  const getEventIcon = (type) => {
    const eventTypes = {
      goal: "⚽",
      yellow_card: "🟨",
      red_card: "🟥",
      substitution: "🔄",
      offside: "🚩",
      foul: "⚠️",
      corner: "📐",
      penalty: "🥅",
    };
    return eventTypes[type] || "📝";
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = () => {
    if (!match?.status) return "#666";

    switch (match.status) {
      case "live":
        return "#ff4d4f";
      case "paused":
        return "#faad14";
      case "finished":
        return "#52c41a";
      case "scheduled":
        return "#1890ff";
      default:
        return "#666";
    }
  };

  // 🔑 Fonction pour obtenir le texte du statut avec timer
  const getStatusText = () => {
    if (!match?.status) return "INCONNU";

    switch (match.status) {
      case "live":
        return `EN DIRECT (${String(timer.minute).padStart(2, "0")}:${String(
          timer.second
        ).padStart(2, "0")})`;
      case "paused":
        return `EN PAUSE (${String(timer.minute).padStart(2, "0")}')`;
      case "finished":
        return "TERMINÉ";
      case "scheduled":
        return "À VENIR";
      default:
        return match.status.toUpperCase();
    }
  };

  // Formatage de la date
  const formatMatchDate = () => {
    if (!match?.startAt) return null;

    const date = new Date(match.startAt);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onRefresh = () => {
    fetchMatch(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>Chargement du match...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Match introuvable</Text>
        <Text style={styles.errorSubtitle}>
          Impossible de charger les détails de ce match
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchMatch();
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extraction sécurisée des noms d'équipes
  const getTeamName = (team) => {
    if (typeof team === "string") return team;
    if (typeof team === "object" && team?.name) return team.name;
    return null;
  };

  const getTeamShort = (team, fallbackName) => {
    if (typeof team === "object" && team?.shortName) return team.shortName;
    if (typeof team === "string") return team.substring(0, 3).toUpperCase();
    if (fallbackName) return fallbackName.substring(0, 3).toUpperCase();
    return "TBD";
  };

  const home =
    getTeamName(match.homeTeam) ??
    getTeamName(match.home_team) ??
    "Équipe domicile";
  const away =
    getTeamName(match.awayTeam) ??
    getTeamName(match.away_team) ??
    "Équipe extérieure";
  const homeShort =
    getTeamShort(match.homeTeam, home) ?? getTeamShort(match.home_team, home);
  const awayShort =
    getTeamShort(match.awayTeam, away) ?? getTeamShort(match.away_team, away);
  const homeScore = match.homeScore ?? match.home_score ?? 0;
  const awayScore = match.awayScore ?? match.away_score ?? 0;
  const events = match.events ?? [];

  // 🔑 Déterminer si le match est en cours
  const isLive = match.status === "live" || match.status === "paused";

  const renderEventItem = ({ item, index }) => (
    <View style={[styles.eventItem, index === 0 && styles.firstEventItem]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTime}>
          <Text style={styles.eventMinute}>
            {item.minute ? `${item.minute}'` : "—"}
          </Text>
        </View>
        <View style={styles.eventIcon}>
          <Text style={styles.eventIconText}>{getEventIcon(item.type)}</Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventType}>
            {typeof item.type === "string"
              ? item.type.replace("_", " ")
              : "Événement"}
          </Text>
          {item.player && typeof item.player === "string" && (
            <Text style={styles.eventPlayer}>{item.player}</Text>
          )}
          {item.team && (
            <Text style={styles.eventTeam}>
              (
              {typeof item.team === "string"
                ? item.team
                : getTeamName(item.team) || "Équipe"}
              )
            </Text>
          )}
        </View>
      </View>
      {item.description && (
        <Text style={styles.eventDescription}>{item.description}</Text>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1890ff"
          colors={["#1890ff"]}
        />
      }
    >
      {/* Header avec statut */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          >
            <Text style={styles.statusText}>{getStatusText()}</Text>
            {isLive && <View style={styles.liveDot} />}
          </View>

          {formatMatchDate() && (
            <Text style={styles.matchDate}>{formatMatchDate()}</Text>
          )}
        </View>
      </View>

      {/* Équipes et score */}
      <View style={styles.matchHeader}>
        <View style={styles.teamsContainer}>
          {/* Équipe domicile */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadge}>
              <Text style={styles.teamShort}>{homeShort}</Text>
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {home}
            </Text>
          </View>

          {/* Score central */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreDisplay}>
              <Text style={styles.score}>{homeScore}</Text>

              <View style={styles.scoreSeparatorContainer}>
                {isLive && (
                  <View style={styles.liveTimerContainer}>
                    <Text style={styles.liveTimerText}>
                      {String(timer.minute).padStart(2, "0")}'
                    </Text>
                  </View>
                )}
                <Text style={styles.scoreSeparator}>-</Text>
              </View>

              <Text style={styles.score}>{awayScore}</Text>
            </View>
          </View>

          {/* Équipe extérieure */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadge}>
              <Text style={styles.teamShort}>{awayShort}</Text>
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {away}
            </Text>
          </View>
        </View>
      </View>

      {/* Statistiques rapides */}
      {match.stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            {Object.entries(match.stats).map(([key, value]) => (
              <View key={key} style={styles.statItem}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>
                  {key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Section événements */}
      <View style={styles.eventsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Événements du match</Text>
          <View style={styles.eventsCountBadge}>
            <Text style={styles.eventsCountText}>{events.length}</Text>
          </View>
        </View>

        {events.length > 0 ? (
          <View style={styles.eventsList}>
            <FlatList
              data={[...events].reverse()}
              keyExtractor={(item) =>
                String(item.id) ?? `${item.type}-${item.minute}-${Date.now()}`
              }
              renderItem={renderEventItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsIcon}>📋</Text>
            <Text style={styles.noEventsText}>
              Aucun événement pour le moment
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#fff",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginLeft: 6,
  },
  matchDate: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  matchHeader: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
    maxWidth: width * 0.3,
  },
  teamBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: "#e8f4fd",
  },
  teamShort: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1890ff",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
  },
  scoreSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 32,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  score: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#333",
    minWidth: 40,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  scoreSeparatorContainer: {
    alignItems: "center",
    marginHorizontal: 12,
  },
  liveTimerContainer: {
    backgroundColor: "#ff4d4f",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  liveTimerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  scoreSeparator: {
    fontSize: 28,
    color: "#999",
    fontWeight: "300",
  },
  statsContainer: {
    backgroundColor: "#fff",
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  eventsCountBadge: {
    backgroundColor: "#e8f4fd",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  eventsCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1890ff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    width: "30%",
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1890ff",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    textTransform: "capitalize",
  },
  eventsSection: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventsList: {
    marginTop: 8,
  },
  eventItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  firstEventItem: {
    paddingTop: 0,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  eventTime: {
    width: 50,
    alignItems: "center",
    marginRight: 12,
  },
  eventMinute: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1890ff",
    backgroundColor: "#e8f4fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
    textAlign: "center",
  },
  eventIcon: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 20,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  eventPlayer: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  eventTeam: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  eventDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    marginLeft: 94,
    fontStyle: "italic",
    lineHeight: 18,
  },
  noEventsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginTop: 8,
  },
  noEventsIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noEventsText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
