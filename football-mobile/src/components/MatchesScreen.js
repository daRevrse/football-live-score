// src/screens/MatchesScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // ou react-native-linear-gradient
import socket from "../services/socket";
import MatchItem from "./MatchItem";
import axios from "axios";

const { width, height } = Dimensions.get("window");
const API_URL = "http://192.168.1.65:5000"; // <--- adapte selon ton backend

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [timers, setTimers] = useState(new Map()); // État local pour les timers
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchMatches();

    // Gestion de la connexion socket
    const onConnect = () => {
      console.log("🟢 Socket connecté");
      setConnectionStatus("connected");
    };

    const onDisconnect = () => {
      console.log("🔴 Socket déconnecté");
      setConnectionStatus("disconnected");
    };

    // Handler pour les matches créés
    const onCreated = (newMatch) => {
      console.log("📝 Nouveau match créé:", newMatch.id);
      setMatches((prev) => {
        if (prev.find((m) => m.id === newMatch.id)) return prev;
        return [newMatch, ...prev];
      });
    };

    // Handler pour les matches mis à jour (scores, statut, etc.)
    const onUpdated = (updatedMatch) => {
      console.log("🔄 Match mis à jour:", updatedMatch.id);
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
    };

    // Handler spécifique pour les mises à jour du timer
    const onTimerUpdate = (timerData) => {
      if (!timerData.matchId) return;

      console.log(
        `⏰ Timer mis à jour pour match ${timerData.matchId}:`,
        `${timerData.currentMinute}:${String(timerData.currentSecond).padStart(
          2,
          "0"
        )}`
      );

      // Met à jour l'état des timers
      setTimers(
        (prev) =>
          new Map(
            prev.set(timerData.matchId, {
              currentMinute: timerData.currentMinute,
              currentSecond: timerData.currentSecond,
              status: timerData.status,
              lastUpdate: Date.now(),
            })
          )
      );

      // Met à jour aussi le match si nécessaire
      setMatches((prev) =>
        prev.map((match) =>
          match.id === timerData.matchId
            ? {
                ...match,
                currentMinute: timerData.currentMinute,
                currentSecond: timerData.currentSecond,
                status: timerData.status,
              }
            : match
        )
      );
    };

    // Handler pour les événements de match
    const onEvent = (payload) => {
      if (!payload) return;

      console.log("🎯 Événement de match reçu:", payload);

      // payload peut contenir { match, event }
      if (payload.match) {
        onUpdated(payload.match);
      } else if (payload.event && payload.event.matchId) {
        // Mise à jour spécifique pour l'événement
        setMatches((prev) =>
          prev.map((m) =>
            m.id === payload.event.matchId
              ? {
                  ...m,
                  // Mise à jour du score si c'est un but
                  ...(payload.event.type.includes("goal") && payload.match
                    ? {
                        homeScore: payload.match.homeScore,
                        awayScore: payload.match.awayScore,
                      }
                    : {}),
                }
              : m
          )
        );
      }
    };

    // Handlers pour les changements d'état de match
    const onMatchStarted = (data) => {
      console.log("🟢 Match démarré:", data.matchId);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === data.matchId
            ? { ...m, status: "live", kickoffTime: data.startTime }
            : m
        )
      );
    };

    const onMatchPaused = (data) => {
      console.log("⏸️ Match en pause:", data.matchId);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === data.matchId ? { ...m, status: "paused" } : m
        )
      );
    };

    const onMatchResumed = (data) => {
      console.log("▶️ Match repris:", data.matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === data.matchId ? { ...m, status: "live" } : m))
      );
    };

    const onMatchFinished = (data) => {
      console.log("🏁 Match terminé:", data.matchId);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === data.matchId ? { ...m, status: "finished" } : m
        )
      );
      // Retire le timer du match terminé
      setTimers((prev) => {
        const newTimers = new Map(prev);
        newTimers.delete(data.matchId);
        return newTimers;
      });
    };

    const onSecondHalfStarted = (data) => {
      console.log("🔄 Seconde mi-temps démarrée:", data.matchId);
    };

    const onAdditionalTime = (data) => {
      console.log(
        `⏰ Temps additionnel défini pour match ${data.matchId}:`,
        `${data.minutes}min (${data.half}ème MT)`
      );
    };

    // Enregistrement des listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("match_created", onCreated);
    socket.on("match_updated", onUpdated);
    socket.on("match:event", onEvent);
    socket.on("match:timer", onTimerUpdate); // Handler spécifique pour le timer
    socket.on("match:started", onMatchStarted);
    socket.on("match:paused", onMatchPaused);
    socket.on("match:resumed", onMatchResumed);
    socket.on("match:finished", onMatchFinished);
    socket.on("match:second_half_started", onSecondHalfStarted);
    socket.on("match:additional_time", onAdditionalTime);

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("match_created", onCreated);
      socket.off("match_updated", onUpdated);
      socket.off("match:event", onEvent);
      socket.off("match:timer", onTimerUpdate);
      socket.off("match:started", onMatchStarted);
      socket.off("match:paused", onMatchPaused);
      socket.off("match:resumed", onMatchResumed);
      socket.off("match:finished", onMatchFinished);
      socket.off("match:second_half_started", onSecondHalfStarted);
      socket.off("match:additional_time", onAdditionalTime);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/matches`);
      if (!mountedRef.current) return;

      const matchesData = res.data || [];
      setMatches(matchesData);

      // Initialise les timers pour les matches en cours
      const newTimers = new Map();
      matchesData.forEach((match) => {
        if (match.status === "live" || match.status === "paused") {
          newTimers.set(match.id, {
            currentMinute: match.currentMinute || 0,
            currentSecond: match.currentSecond || 0,
            status: match.status,
            lastUpdate: Date.now(),
          });
        }
      });
      setTimers(newTimers);

      console.log(
        `📊 ${matchesData.length} matches chargés, ${newTimers.size} timers actifs`
      );
    } catch (err) {
      console.warn("fetchMatches error", err.message || err);
      setConnectionStatus("error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  // Fonction pour enrichir un match avec les données du timer
  const enrichMatchWithTimer = (match) => {
    const timerData = timers.get(match.id);
    if (!timerData) return match;

    return {
      ...match,
      currentMinute: timerData.currentMinute,
      currentSecond: timerData.currentSecond,
      status: timerData.status,
      timerLastUpdate: timerData.lastUpdate,
    };
  };

  // Filtrage des matches
  const getFilteredMatches = () => {
    let filtered;
    switch (selectedFilter) {
      case "live":
        filtered = matches.filter(
          (match) => match.status === "live" || match.status === "paused"
        );
        break;
      case "today":
        const today = new Date().toDateString();
        filtered = matches.filter(
          (match) => new Date(match.startAt).toDateString() === today
        );
        break;
      case "finished":
        filtered = matches.filter((match) => match.status === "finished");
        break;
      case "scheduled":
        filtered = matches.filter((match) => match.status === "scheduled");
        break;
      default:
        filtered = matches;
    }

    // Enrichit chaque match avec les données du timer
    return filtered.map(enrichMatchWithTimer);
  };

  const filteredMatches = getFilteredMatches();
  const liveCount = matches.filter(
    (m) => m.status === "live" || m.status === "paused"
  ).length;
  const todayCount = matches.filter(
    (m) => new Date(m.startAt).toDateString() === new Date().toDateString()
  ).length;

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.itemContainer,
        {
          marginTop: index === 0 ? 8 : 0,
          marginBottom: index === filteredMatches.length - 1 ? 20 : 0,
        },
      ]}
    >
      <MatchItem
        match={item} // Le match est déjà enrichi avec les données du timer
        onPress={(match) =>
          navigation?.navigate?.("MatchDetail", { id: match.id })
        }
      />
    </View>
  );

  const renderFilterButton = (filter, label, count = null) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterText,
          selectedFilter === filter && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
      {count !== null && count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderConnectionStatus = () => {
    if (connectionStatus === "connected") return null;

    return (
      <View
        style={[
          styles.statusBar,
          connectionStatus === "error"
            ? styles.errorBar
            : styles.disconnectedBar,
        ]}
      >
        <Text style={styles.statusText}>
          {connectionStatus === "error"
            ? "⚠️ Erreur de connexion"
            : "📡 Reconnexion en cours..."}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={["#1890ff", "#096dd9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Matches</Text>
              <Text style={styles.headerSubtitle}>
                {matches.length} match{matches.length > 1 ? "es" : ""} au total
                {timers.size > 0 &&
                  ` • ${timers.size} timer${timers.size > 1 ? "s" : ""} actif${
                    timers.size > 1 ? "s" : ""
                  }`}
              </Text>
            </View>

            {liveCount > 0 && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{liveCount} LIVE</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: "all", label: "Tous" },
            { key: "live", label: "En direct", count: liveCount },
            { key: "today", label: "Aujourd'hui", count: todayCount },
            { key: "scheduled", label: "À venir" },
            { key: "finished", label: "Terminés" },
          ]}
          renderItem={({ item }) =>
            renderFilterButton(item.key, item.label, item.count)
          }
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersContent}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      switch (selectedFilter) {
        case "live":
          return {
            icon: "📺",
            title: "Aucun match en direct",
            subtitle: "Les matches en cours apparaîtront ici en temps réel",
          };
        case "today":
          return {
            icon: "📅",
            title: "Aucun match aujourd'hui",
            subtitle: "Revenez demain pour de nouveaux matches",
          };
        case "finished":
          return {
            icon: "🏆",
            title: "Aucun match terminé",
            subtitle: "Les résultats apparaîtront ici",
          };
        case "scheduled":
          return {
            icon: "⏰",
            title: "Aucun match programmé",
            subtitle: "Les prochains matches apparaîtront ici",
          };
        default:
          return {
            icon: "⚽",
            title: "Aucun match disponible",
            subtitle: "Tirez vers le bas pour actualiser",
          };
      }
    };

    const empty = getEmptyMessage();

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{empty.icon}</Text>
        <Text style={styles.emptyTitle}>{empty.title}</Text>
        <Text style={styles.emptySubtitle}>{empty.subtitle}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1890ff" />
        {renderHeader()}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Chargement des matches...</Text>
          {connectionStatus === "connected" && (
            <Text style={styles.loadingSubtext}>
              🟢 Connexion temps réel active
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1890ff" />
      {renderConnectionStatus()}

      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1890ff"]}
            tintColor="#1890ff"
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        style={styles.list}
        contentContainerStyle={
          filteredMatches.length === 0 ? styles.emptyList : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  header: {
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4d4f",
    marginRight: 6,
  },
  liveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  filtersContainer: {
    backgroundColor: "white",
    paddingVertical: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: "#1890ff",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterTextActive: {
    color: "white",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "green",
  },
  statusBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  errorBar: {
    backgroundColor: "#ff7875",
  },
  disconnectedBar: {
    backgroundColor: "#faad14",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  itemContainer: {
    marginHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
