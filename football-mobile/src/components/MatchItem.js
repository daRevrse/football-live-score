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

const API_URL = "http://192.168.1.65:5000";

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
  const homeLogo = match.homeTeam?.logo ?? match.home_team_logo;
  const awayLogo = match.awayTeam?.logo ?? match.away_team_logo;

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

  // Styles dynamiques
  const getStatusConfig = () => {
    switch (status) {
      case "live":
        return {
          backgroundColor: "#fef2f2",
          borderColor: "#dc2626",
          textColor: "#dc2626",
          icon: <Flame width={14} height={14} color="#dc2626" />,
          text: "EN DIRECT",
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
  const isLive = status === "live";

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
            {status === "finished" || status === "live" ? (
              <View style={styles.scoreDisplay}>
                <Text style={styles.score}>{homeScore}</Text>
                <Text style={styles.scoreSeparator}>-</Text>
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
    borderRadius: 16,
    margin: 12,
    overflow: "hidden",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  dateText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
    maxWidth: "35%",
  },
  teamLogo: {
    width: "100%",
    height: "100%",
    // borderRadius: 28, // Même valeur que teamBadge pour un cercle parfait
  },
  teamBadge: {
    width: 56,
    height: 56,
    // borderRadius: 28,
    // backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // borderWidth: 2,
    // borderColor: "#e2e8f0",
    // overflow: "hidden", // Important pour que l'image respecte le border radius
  },
  teamShort: {
    fontSize: 14,
    fontWeight: "900",
    color: "#3b82f6",
    letterSpacing: 0.5,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    lineHeight: 18,
  },
  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    minWidth: "30%",
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  score: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1e293b",
    minWidth: 40,
    textAlign: "center",
  },
  scoreSeparator: {
    fontSize: 24,
    color: "#cbd5e1",
    marginHorizontal: 16,
    fontWeight: "300",
  },
  vsContainer: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  vsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 2,
  },
  locationSection: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fefefe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
});

export default MatchItem;
