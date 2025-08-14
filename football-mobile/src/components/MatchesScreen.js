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
const API_URL = "http://192.168.1.75:5000"; // <--- adapte selon ton backend

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

    // Gestion de la connexion socket
    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");

    // handlers
    const onCreated = (newMatch) => {
      setMatches((prev) => {
        if (prev.find((m) => m.id === newMatch.id)) return prev;
        return [newMatch, ...prev];
      });
    };

    const onUpdated = (updatedMatch) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      );
    };

    const onEvent = (payload) => {
      if (!payload) return;
      // payload may contain { match, event }
      if (payload.match) {
        onUpdated(payload.match);
      } else if (payload.event) {
        // fallback: update single event into the list if we have that match
        setMatches((prev) =>
          prev.map((m) =>
            m.id === payload.event.matchId
              ? { ...m /* optional: update structure */ }
              : m
          )
        );
      }
    };

    // const handleTimerUpdate = (payload) => {
    //   if (payload.match.matchId === match.id) {
    //     setTimerState((prev) => ({
    //       ...prev,
    //       currentMinute: payload.match.currentMinute,
    //       currentSecond: payload.match.currentSecond,
    //       isRunning: payload.match.status === "live",
    //     }));
    //   }
    // };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("match_created", onCreated);
    socket.on("match_updated", onUpdated);
    socket.on("match:event", onEvent);
    socket.on("match:timer", onUpdated);

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("match_created", onCreated);
      socket.off("match_updated", onUpdated);
      socket.off("match:event", onEvent);
      socket.off("match:timer", onUpdated);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/matches`);
      if (!mountedRef.current) return;
      setMatches(res.data || []);
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

  // Filtrage des matches
  const getFilteredMatches = () => {
    switch (selectedFilter) {
      case "live":
        return matches.filter((match) => match.status === "live");
      case "today":
        const today = new Date().toDateString();
        return matches.filter(
          (match) => new Date(match.startAt).toDateString() === today
        );
      case "finished":
        return matches.filter((match) => match.status === "finished");
      case "scheduled":
        return matches.filter((match) => match.status === "scheduled");
      default:
        return matches;
    }
  };

  const filteredMatches = getFilteredMatches();
  const liveCount = matches.filter((m) => m.status === "live").length;
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
        match={item}
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
            : "📡 Connexion perdue"}
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
            subtitle: "Les matches en cours apparaîtront ici",
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
