// src/components/MatchItem.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function MatchItem({ match, onPress }) {
  const home = match.homeTeam?.name ?? match.home_team ?? "Home";
  const away = match.awayTeam?.name ?? match.away_team ?? "Away";
  const homeShort =
    match.homeTeam?.shortName ??
    match.home_team_short ??
    home.substring(0, 3).toUpperCase();
  const awayShort =
    match.awayTeam?.shortName ??
    match.away_team_short ??
    away.substring(0, 3).toUpperCase();
  const homeScore = match.homeScore ?? match.home_score ?? 0;
  const awayScore = match.awayScore ?? match.away_score ?? 0;
  const status = match.status || "scheduled";

  // Fonction pour obtenir les couleurs selon le statut
  const getStatusStyle = () => {
    switch (status) {
      case "live":
        return { backgroundColor: "#ff4d4f", color: "#fff" };
      case "finished":
        return { backgroundColor: "#52c41a", color: "#fff" };
      case "scheduled":
        return { backgroundColor: "#1890ff", color: "#fff" };
      default:
        return { backgroundColor: "#d9d9d9", color: "#666" };
    }
  };

  // Fonction pour obtenir le style de la carte selon le statut
  const getCardStyle = () => {
    const baseStyle = styles.card;
    switch (status) {
      case "live":
        return [baseStyle, styles.liveCard];
      case "finished":
        return [baseStyle, styles.finishedCard];
      default:
        return baseStyle;
    }
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Aujourd'hui ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isTomorrow) {
      return `Demain ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = () => {
    switch (status) {
      case "live":
        return "EN DIRECT";
      case "finished":
        return "TERMINÉ";
      case "scheduled":
        return "À VENIR";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress && onPress(match)}
      style={getCardStyle()}
      activeOpacity={0.8}
    >
      {/* Indicateur live */}
      {status === "live" && (
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* En-tête avec équipes */}
      <View style={styles.mainRow}>
        {/* Équipe domicile */}
        <View style={styles.teamContainer}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamShort}>{homeShort}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {home}
          </Text>
        </View>

        {/* Score central */}
        <View style={styles.scoreContainer}>
          {status === "finished" || status === "live" ? (
            <View style={styles.scoreDisplay}>
              <Text style={styles.score}>{homeScore}</Text>
              <Text style={styles.scoreSeparator}>—</Text>
              <Text style={styles.score}>{awayScore}</Text>
            </View>
          ) : (
            <View style={styles.vsContainer}>
              <Text style={styles.vs}>VS</Text>
            </View>
          )}
        </View>

        {/* Équipe extérieur */}
        <View style={[styles.teamContainer, styles.awayTeam]}>
          <Text
            style={[styles.teamName, styles.awayTeamName]}
            numberOfLines={1}
          >
            {away}
          </Text>
          <View style={styles.teamBadge}>
            <Text style={styles.teamShort}>{awayShort}</Text>
          </View>
        </View>
      </View>

      {/* Informations supplémentaires */}
      <View style={styles.metaRow}>
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={[styles.statusText, { color: getStatusStyle().color }]}>
            {getStatusText()}
          </Text>
        </View>

        {match.startAt && (
          <Text style={styles.startAt}>{formatDate(match.startAt)}</Text>
        )}
      </View>

      {/* Événements récents (si disponibles) */}
      {match.events && match.events.length > 0 && (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Derniers événements:</Text>
          {match.events.slice(-2).map((event, index) => (
            <Text key={index} style={styles.eventItem}>
              {event.minute}'{" "}
              {event.type === "goal"
                ? "⚽"
                : event.type.includes("card")
                ? "🟨"
                : ""}{" "}
              {event.player}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  liveCard: {
    borderColor: "#ff4d4f",
    borderWidth: 2,
  },
  finishedCard: {
    opacity: 0.9,
  },
  liveIndicator: {
    position: "absolute",
    top: 10,
    right: 140,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4d4f",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
    maxWidth: width * 0.3,
  },
  awayTeam: {
    alignItems: "center",
  },
  teamBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  teamShort: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1890ff",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  awayTeamName: {
    textAlign: "center",
  },
  scoreContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },
  scoreSeparator: {
    fontSize: 20,
    color: "#999",
    marginHorizontal: 12,
  },
  vsContainer: {
    backgroundColor: "#e8f4fd",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  vs: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1890ff",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  startAt: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  eventsContainer: {
    backgroundColor: "#fafafa",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  eventsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  eventItem: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
});
