import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import {
  Clock,
  MapPin,
  Flame,
  Calendar,
  CircleCheck,
} from "lucide-react-native";
import socket from "../services/socket";

const API_URL = "http://192.168.1.75:5000";

const MatchItem = ({ match, onPress, index = 0 }) => {
  // Extraction des données avec fallbacks
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

  // 🔑 État local pour le timer (comme dans la version web)
  const [timer, setTimer] = useState({
    minute: match.currentMinute || 0,
    second: match.currentSecond || 0,
  });

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateYAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 🔑 Gestion Socket individuelle par match (comme dans la version web)
  useEffect(() => {
    if (status !== "live") return;

    console.log(`🔌 Joining match ${match.id} for timer updates`);
    socket.emit("joinMatch", match.id);

    const handleTimerUpdate = (data) => {
      if (data.matchId === match.id) {
        // console.log(`⏱️ Timer update for match ${match.id}:`, data);
        setTimer({
          minute: data.currentMinute,
          second: data.currentSecond,
        });
      }
    };

    socket.on("match:timer", handleTimerUpdate);

    return () => {
      console.log(`🔌 Leaving match ${match.id}`);
      socket.emit("leaveMatch", match.id);
      socket.off("match:timer", handleTimerUpdate);
    };
  }, [match.id, status]);

  // 🔑 Mettre à jour le timer local quand les props changent
  useEffect(() => {
    setTimer({
      minute: match.currentMinute || 0,
      second: match.currentSecond || 0,
    });
  }, [match.currentMinute, match.currentSecond]);

  // Styles dynamiques
  const getStatusConfig = () => {
    switch (status) {
      case "live":
      case "paused":
        return {
          backgroundColor: "#fef2f2",
          borderColor: "#dc2626",
          textColor: "#dc2626",
          icon: <Flame width={14} height={14} color="#dc2626" />,
          text: status === "paused" ? "EN PAUSE" : "EN DIRECT",
        };
      case "finished":
        return {
          backgroundColor: "#f0fdf4",
          borderColor: "#16a34a",
          textColor: "#16a34a",
          icon: <CircleCheck width={14} height={14} color="#16a34a" />,
          text: "TERMINÉ",
        };
      case "scheduled":
        return {
          backgroundColor: "#eff6ff",
          borderColor: "#2563eb",
          textColor: "#2563eb",
          icon: <Clock width={14} height={14} color="#2563eb" />,
          text: "À VENIR",
        };
      default:
        return {
          backgroundColor: "#f3f4f6",
          borderColor: "#6b7280",
          textColor: "#6b7280",
          icon: <Calendar width={14} height={14} color="#6b7280" />,
          text: status.toUpperCase(),
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isLive = status === "live" || status === "paused";

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
      return `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isTomorrow) {
      return `Demain à ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
          borderColor: isLive ? "#dc2626" : "#e2e8f0",
        },
      ]}
    >
      <TouchableOpacity onPress={() => onPress && onPress(match)}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDate(match.startAt)}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.backgroundColor,
                borderColor: statusConfig.borderColor,
              },
            ]}
          >
            {statusConfig.icon}
            <Text
              style={[styles.statusText, { color: statusConfig.textColor }]}
            >
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Contenu principal */}
        <View style={styles.mainContent}>
          {/* Équipe domicile */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadge}>
              {match.homeTeam?.logoUrl ? (
                <Image
                  source={{
                    uri: match.homeTeam.logoUrl.replace(
                      "http://localhost:5000",
                      API_URL
                    ),
                  }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.teamShort}>{homeShort}</Text>
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {home}
            </Text>
          </View>

          {/* Section centrale (Score ou VS) */}
          <View style={styles.centerSection}>
            {status === "finished" || isLive ? (
              <View style={styles.scoreDisplay}>
                <Text style={styles.score}>{homeScore}</Text>

                <View
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isLive && (
                    <View style={styles.timerContainer}>
                      <Text style={styles.timerText}>
                        {String(timer.minute).padStart(2, "0")}:
                        {String(timer.second).padStart(2, "0")}'
                      </Text>
                    </View>
                  )}
                  <Text style={styles.scoreSeparator}>-</Text>
                </View>
                <Text style={styles.score}>{awayScore}</Text>
              </View>
            ) : (
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            )}
          </View>

          {/* Équipe extérieure */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadge}>
              {match.awayTeam?.logoUrl ? (
                <Image
                  source={{
                    uri: match.awayTeam.logoUrl.replace(
                      "http://localhost:5000",
                      API_URL
                    ),
                  }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.teamShort}>{awayShort}</Text>
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {away}
            </Text>
          </View>
        </View>

        {/* Localisation */}
        {match.location && (
          <View style={styles.locationSection}>
            <MapPin width={14} height={14} color="#64748b" />
            <Text style={styles.locationText}>{match.location}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  teamLogo: {
    width: 40,
    height: 40,
  },
  teamShort: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 100,
  },
  centerSection: {
    minWidth: 100,
    alignItems: "center",
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
  },
  scoreSeparator: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc2626",
  },
  vsContainer: {
    paddingVertical: 8,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748b",
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
});

export default MatchItem;
