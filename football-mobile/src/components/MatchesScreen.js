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
import { LinearGradient } from "expo-linear-gradient";
import socket from "../services/socket";
import MatchItem from "./MatchItem";
import axios from "axios";

const { width, height } = Dimensions.get("window");
const API_URL = "http://192.168.1.75:5000";

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchMatches();

    // Gestion des événements Socket.IO
    const onConnect = () => {
      console.log("🟢 Socket connecté");
      setConnectionStatus("connected");
    };

    const onDisconnect = () => {
      console.log("🔴 Socket déconnecté");
      setConnectionStatus("disconnected");
    };

    // 🔑 Simplification : seulement mise à jour des matches
    const onTimerUpdate = (timerData) => {
      // console.log("⏱️ Timer update reçu:", timerData);
      if (!timerData.matchId) return;

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

    const onMatchUpdate = (updatedMatch) => {
      // console.log("🔄 Match update reçu:", updatedMatch.id);
      setMatches((prev) =>
        prev.map((match) =>
          match.id === updatedMatch.id ? updatedMatch : match
        )
      );
    };

    const onMatchCreated = (newMatch) => {
      console.log("✨ Nouveau match créé:", newMatch.id);
      setMatches((prev) => [newMatch, ...prev]);
    };

    // Enregistrement des listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("match:timer", onTimerUpdate);
    socket.on("match_updated", onMatchUpdate);
    socket.on("match_created", onMatchCreated);

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("match:timer", onTimerUpdate);
      socket.off("match_updated", onMatchUpdate);
      socket.off("match_created", onMatchCreated);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/matches`);
      if (!mountedRef.current) return;

      const matchesData = res.data || [];
      console.log("📥 Matches chargés:", matchesData.length);
      setMatches(matchesData);
    } catch (err) {
      console.error("❌ Erreur de chargement:", err);
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

  // 🔑 Filtrage simple sans enrichissement
  const getFilteredMatches = () => {
    switch (selectedFilter) {
      case "live":
        return matches.filter(
          (m) => m.status === "live" || m.status === "paused"
        );
      case "today":
        const today = new Date().toDateString();
        return matches.filter(
          (m) => new Date(m.startAt).toDateString() === today
        );
      case "finished":
        return matches.filter((m) => m.status === "finished");
      case "scheduled":
        return matches.filter((m) => m.status === "scheduled");
      default:
        return matches;
    }
  };

  const filteredMatches = getFilteredMatches();
  const liveCount = matches.filter(
    (m) => m.status === "live" || m.status === "paused"
  ).length;
  const todayCount = matches.filter(
    (m) => new Date(m.startAt).toDateString() === new Date().toDateString()
  ).length;

  const renderItem = ({ item, index }) => (
    <MatchItem
      match={item}
      onPress={() => navigation.navigate("MatchDetail", { id: item.id })}
      index={index}
    />
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
                {matches.length} match{matches.length !== 1 ? "es" : ""} •{" "}
                {liveCount} en direct
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⚽</Text>
      <Text style={styles.emptyTitle}>
        {selectedFilter === "live"
          ? "Aucun match en direct"
          : selectedFilter === "today"
          ? "Aucun match aujourd'hui"
          : "Aucun match disponible"}
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1890ff" />
        {renderHeader()}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Chargement des matches...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1890ff" />

      {connectionStatus !== "connected" && (
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
              ? "Erreur de connexion"
              : "Tentative de reconnexion..."}
          </Text>
        </View>
      )}

      <FlatList
        data={filteredMatches}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1890ff"]}
            tintColor="#1890ff"
          />
        }
        contentContainerStyle={
          filteredMatches.length === 0 ? styles.emptyList : null
        }
      />
    </View>
  );
}

// Styles restent identiques...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  statusBar: {
    padding: 10,
    alignItems: "center",
  },
  errorBar: {
    backgroundColor: "#ff4d4f",
  },
  disconnectedBar: {
    backgroundColor: "#faad14",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyList: {
    flexGrow: 1,
  },
});
