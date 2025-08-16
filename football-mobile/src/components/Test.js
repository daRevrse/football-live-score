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
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Mock data pour la démonstration
const mockMatches = [
  {
    id: 1,
    homeTeamId: 1,
    awayTeamId: 2,
    homeScore: 2,
    awayScore: 1,
    status: "live",
    startAt: new Date().toISOString(),
    location: "Stade Municipal",
    currentMinute: 67,
    currentSecond: 34,
    homeTeam: { name: "FC Lions", logo: "🦁" },
    awayTeam: { name: "AS Eagles", logo: "🦅" },
  },
  {
    id: 2,
    homeTeamId: 3,
    awayTeamId: 4,
    homeScore: 1,
    awayScore: 3,
    status: "finished",
    startAt: new Date(Date.now() - 86400000).toISOString(),
    location: "Complexe Sportif",
    homeTeam: { name: "RC Tigers", logo: "🐅" },
    awayTeam: { name: "US Panthers", logo: "🐆" },
  },
  {
    id: 3,
    homeTeamId: 5,
    awayTeamId: 6,
    homeScore: 0,
    awayScore: 0,
    status: "scheduled",
    startAt: new Date(Date.now() + 86400000).toISOString(),
    location: "Terrain Central",
    homeTeam: { name: "AC Wolves", logo: "🐺" },
    awayTeam: { name: "SC Sharks", logo: "🦈" },
  },
];

// Composant MatchItem amélioré
const MatchItem = ({ match, onPress, index }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusStyle = () => {
    switch (match.status) {
      case "live":
        return {
          backgroundColor: "#fef2f2",
          borderColor: "#dc2626",
          textColor: "#dc2626",
          icon: "🔴",
          text: "EN DIRECT",
        };
      case "finished":
        return {
          backgroundColor: "#f0fdf4",
          borderColor: "#16a34a",
          textColor: "#16a34a",
          icon: "✅",
          text: "TERMINÉ",
        };
      default:
        return {
          backgroundColor: "#eff6ff",
          borderColor: "#2563eb",
          textColor: "#2563eb",
          icon: "⏰",
          text: "À VENIR",
        };
    }
  };

  const statusStyle = getStatusStyle();
  const isLive = match.status === "live";

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }, { scale: scaleValue }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.matchCard, isLive && styles.liveMatchCard]}
        onPress={() => onPress(match)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* {isLive && (
          <LinearGradient
            colors={["#dc2626", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveIndicator}
          >
            <View style={styles.livePulse} />
            <Text style={styles.liveText}>LIVE</Text>
          </LinearGradient>
        )} */}

        <View style={styles.matchHeader}>
          <Text style={styles.matchDate}>
            {new Date(match.startAt).toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.backgroundColor,
                borderColor: statusStyle.borderColor,
              },
            ]}
          >
            <Text style={styles.statusIcon}>{statusStyle.icon}</Text>
            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
              {statusStyle.text}
            </Text>
          </View>
        </View>

        <View style={styles.matchContent}>
          <View style={styles.teamSection}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamLogo}>{match.homeTeam.logo}</Text>
              <Text style={styles.teamName} numberOfLines={2}>
                {match.homeTeam.name}
              </Text>
            </View>
            <Text style={styles.teamScore}>{match.homeScore ?? 0}</Text>
          </View>

          <View style={styles.vsSection}>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsDivider} />
            {isLive && match.currentMinute !== undefined && (
              <Text style={styles.timerText}>
                {match.currentMinute}:
                {String(match.currentSecond || 0).padStart(2, "0")}'
              </Text>
            )}
          </View>

          <View style={styles.teamSection}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamLogo}>{match.awayTeam.logo}</Text>
              <Text style={styles.teamName} numberOfLines={2}>
                {match.awayTeam.name}
              </Text>
            </View>
            <Text style={styles.teamScore}>{match.awayScore ?? 0}</Text>
          </View>
        </View>

        {match.location && (
          <View style={styles.matchFooter}>
            <Text style={styles.locationText}>📍 {match.location}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState(mockMatches);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [timers, setTimers] = useState(new Map());
  const mountedRef = useRef(true);
  const headerAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnimatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simuler un délai de chargement
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getFilteredMatches = () => {
    switch (selectedFilter) {
      case "live":
        return matches.filter(
          (match) => match.status === "live" || match.status === "paused"
        );
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
  const liveCount = matches.filter(
    (m) => m.status === "live" || m.status === "paused"
  ).length;
  const todayCount = matches.filter(
    (m) => new Date(m.startAt).toDateString() === new Date().toDateString()
  ).length;

  const renderItem = ({ item, index }) => (
    <MatchItem
      match={item}
      index={index}
      onPress={(match) =>
        navigation?.navigate?.("MatchDetail", { id: match.id })
      }
    />
  );

  const FilterButton = ({ filter, label, count = null, index }) => {
    const isActive = selectedFilter === filter;

    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setSelectedFilter(filter)}
      >
        <LinearGradient
          colors={isActive ? ["#3b82f6", "#8b5cf6"] : ["#f8f9fa", "#f8f9fa"]}
          style={styles.filterGradient}
        >
          <Text
            style={[styles.filterText, isActive && styles.filterTextActive]}
          >
            {label}
          </Text>
          {count !== null && count > 0 && (
            <View
              style={[styles.countBadge, isActive && styles.countBadgeActive]}
            >
              <Text
                style={[styles.countText, isActive && styles.countTextActive]}
              >
                {count}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          transform: [
            {
              translateY: headerAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: headerAnimatedValue,
        },
      ]}
    >
      <LinearGradient
        colors={["#3b82f6", "#8b5cf6", "#ec4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>🏆 Matches</Text>
              <Text style={styles.headerSubtitle}>
                {matches.length} match{matches.length > 1 ? "es" : ""} au total
              </Text>
            </View>

            {liveCount > 0 && (
              <View style={styles.liveIndicatorHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTextHeader}>{liveCount} LIVE</Text>
              </View>
            )}
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
          renderItem={({ item, index }) => (
            <FilterButton
              filter={item.key}
              label={item.label}
              count={item.count}
              index={index}
            />
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersContent}
        />
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => {
    const getEmptyConfig = () => {
      switch (selectedFilter) {
        case "live":
          return {
            emoji: "📺",
            title: "Aucun match en direct",
            subtitle: "Les matches en cours apparaîtront ici en temps réel",
          };
        case "today":
          return {
            emoji: "📅",
            title: "Aucun match aujourd'hui",
            subtitle: "Revenez demain pour de nouveaux matches",
          };
        case "finished":
          return {
            emoji: "🏆",
            title: "Aucun match terminé",
            subtitle: "Les résultats apparaîtront ici",
          };
        case "scheduled":
          return {
            emoji: "⏰",
            title: "Aucun match programmé",
            subtitle: "Les prochains matches apparaîtront ici",
          };
        default:
          return {
            emoji: "⚽",
            title: "Aucun match disponible",
            subtitle: "Tirez vers le bas pour actualiser",
          };
      }
    };

    const config = getEmptyConfig();

    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={["#f8fafc", "#f1f5f9"]}
          style={styles.emptyGradient}
        >
          <Text style={styles.emptyIcon}>{config.emoji}</Text>
          <Text style={styles.emptyTitle}>{config.title}</Text>
          <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <LinearGradient
              colors={["#3b82f6", "#8b5cf6"]}
              style={styles.refreshGradient}
            >
              <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
        <LinearGradient
          colors={["#3b82f6", "#8b5cf6"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Chargement des matches...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
            progressBackgroundColor="white"
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        style={styles.list}
        contentContainerStyle={
          filteredMatches.length === 0 ? styles.emptyList : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  header: {
    backgroundColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontWeight: "500",
  },
  liveIndicatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    marginRight: 6,
  },
  liveTextHeader: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  filtersContainer: {
    backgroundColor: "white",
    paddingVertical: 20,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    marginRight: 12,
    borderRadius: 24,
    overflow: "hidden",
  },
  filterGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  filterButtonActive: {},
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTextActive: {
    color: "white",
  },
  countBadge: {
    backgroundColor: "rgba(107, 114, 128, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  countText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6b7280",
  },
  countTextActive: {
    color: "white",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  matchCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 8,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  liveMatchCard: {
    borderColor: "#dc2626",
    borderWidth: 2,
  },
  liveIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginRight: 6,
  },
  liveText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  matchDate: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  teamLogo: {
    fontSize: 24,
    marginBottom: 6,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    lineHeight: 18,
  },
  teamScore: {
    fontSize: 28,
    fontWeight: "900",
    color: "#3b82f6",
  },
  vsSection: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  vsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  vsDivider: {
    width: 32,
    height: 2,
    backgroundColor: "#e2e8f0",
    borderRadius: 1,
    marginVertical: 8,
  },
  timerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  matchFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyGradient: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  refreshButton: {
    borderRadius: 28,
    overflow: "hidden",
  },
  refreshGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
