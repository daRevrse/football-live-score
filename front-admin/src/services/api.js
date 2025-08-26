import axios from "axios";

export const API_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Gérer la déconnexion si le token est invalide
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const apiLogin = async (credentials) =>
  await api.post("/auth/login", credentials);
export const apiRegister = async (userData) =>
  await api.post("/auth/register", userData);
export const getUserProfile = async () => await api.get("/auth/me");

// ==================== ADMIN API ====================
export const getUsers = async (params = {}) =>
  await api.get("/admin/users", { params });
export const createUser = async (userData) =>
  await api.post("/admin/users", userData);
export const getUserById = async (id) => await api.get(`/admin/users/${id}`);
export const updateUser = async (id, userData) =>
  await api.put(`/admin/users/${id}`, userData);
export const deleteUser = async (id) => await api.delete(`/admin/users/${id}`);

// Récupérer tous les reporters
export const getReporters = async () => {
  return await api.get("/admin/reporters");
};

// Assigner un reporter à un match
export const assignReporterToMatch = async (matchId, reporterId) => {
  return await api.put(`/admin/matches/${matchId}/assign`, { reporterId });
};

// Récupérer les matches assignés à l'utilisateur courant
export const getMyAssignedMatches = async () => {
  return await api.get("/matches/assigned");
};

// ==================== MATCHES API ====================
export const getMatches = async (params = {}) =>
  await api.get("/matches", { params });
export const getMatch = async (id) => await api.get(`/matches/${id}`);
export const createMatch = async (matchData) =>
  await api.post("/matches", matchData);
export const updateMatch = async (id, matchData) =>
  await api.put(`/matches/${id}`, matchData);
export const deleteMatch = async (id) => await api.delete(`/matches/${id}`);

// Match status operations
export const startMatch = async (id) => await api.put(`/matches/${id}/start`);
export const finishMatch = async (id) => {
  await api.post(`/matches/${id}/end`);
  await api.put(`/matches/${id}/finish`);
};
export const pauseMatch = async (id) => await api.post(`/matches/${id}/pause`);
export const resumeMatch = async (id) =>
  await api.post(`/matches/${id}/resume`);
export const startSecondHalf = async (id) =>
  await api.post(`/matches/${id}/second-half`);
export const setAdditionalTime = async (id, half, minutes) =>
  await api.post(`/matches/${id}/additional-time`, { half, minutes });

// Score operations
export const updateScore = async (id, homeScore, awayScore) =>
  await api.put(`/matches/${id}/score`, { homeScore, awayScore });

// Match events
export const getMatchEvents = async (matchId) =>
  await api.get(`/matches/${matchId}/events`);
export const addMatchEvent = async (matchId, eventData) =>
  await api.post(`/matches/${matchId}/events`, eventData);

// Match timer
export const getMatchState = async (id) =>
  await api.get(`/matches/${id}/timer`);

// ==================== TEAMS API ====================
export const getTeams = async (params = {}) =>
  await api.get("/teams", { params });
export const getTeam = async (id) => await api.get(`/teams/${id}`);
export const createTeam = async (teamData) =>
  await api.post("/teams", teamData);
export const updateTeam = async (id, teamData) =>
  await api.put(`/teams/${id}`, teamData);
export const deleteTeam = async (id) => await api.delete(`/teams/${id}`);

// Team matches
export const getTeamHomeMatches = async (id) =>
  await api.get(`/teams/${id}/home-matches`);
export const getTeamAwayMatches = async (id) =>
  await api.get(`/teams/${id}/away-matches`);

// Team statistics
export const getTeamStats = async (id) => await api.get(`/teams/${id}/stats`);
export const getTeamMatches = async (id, params = {}) =>
  await api.get(`/teams/${id}/matches`, { params });

// ==================== UPLOAD API ====================
export const uploadLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);

  return await api.post("/upload/logo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteLogo = async (logoUrl) =>
  await api.delete("/upload/logo", { data: { logoUrl } });

export const getLogos = async () => await api.get("/upload/logo");

// ==================== HELPER FUNCTIONS ====================

export const getLiveMatches = async () => {
  const response = await getMatches();
  return response.data.filter(
    (match) => match.status === "live" || match.status === "paused"
  );
};

export const getUpcomingMatches = async () => {
  const response = await getMatches();
  return response.data
    .filter((match) => match.status === "scheduled")
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  // tri par date si besoin
};

export const getCompletedMatches = async () => {
  const response = await getMatches();
  return response.data
    .filter((match) => match.status === "finished")
    .sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
  // du plus récent au plus ancien
};

export const getTodayMatches = async () => {
  const response = await getMatches();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return response.data.filter((match) => {
    const matchDate = new Date(match.startAt);
    return matchDate >= today && matchDate < tomorrow;
  });
};

// Fonctions pour les événements de match
export const addGoal = async (matchId, teamId, player = null, minute) =>
  await addMatchEvent(matchId, {
    type: "goal",
    teamId: parseInt(teamId),
    player: player || "Joueur inconnu",
    minute: parseInt(minute),
  });

export const addCard = async (
  matchId,
  teamId,
  player,
  minute,
  cardType = "yellow"
) =>
  await addMatchEvent(matchId, {
    type: cardType === "red" ? "red_card" : "yellow_card",
    teamId: parseInt(teamId),
    player,
    minute: parseInt(minute),
  });

// Fonction pour créer un match complet
export const createCompleteMatch = async (
  homeTeamId,
  awayTeamId,
  startAt = null
) => {
  const matchData = {
    homeTeamId: parseInt(homeTeamId),
    awayTeamId: parseInt(awayTeamId),
    startAt: startAt || new Date().toISOString(),
  };
  return await createMatch(matchData);
};

// Fonction pour le classement
export const getLeaderboard = async () => {
  const teamsResponse = await getTeams();
  const teamsWithStats = await Promise.all(
    teamsResponse.data.map(async (team) => {
      try {
        const statsResponse = await getTeamStats(team.id);
        return { ...team, stats: statsResponse.data };
      } catch {
        return { ...team, stats: null };
      }
    })
  );

  return teamsWithStats
    .filter((team) => team.stats)
    .sort((a, b) => {
      if (b.stats.points !== a.stats.points)
        return b.stats.points - a.stats.points;
      return b.stats.goalDifference - a.stats.goalDifference;
    });
};

// Ajout à faire dans front-admin/src/services/api.js

// ==================== PLAYERS API ====================
export const getPlayers = async (params = {}) =>
  await api.get("/players", { params });

export const getTeamPlayers = async (teamId, params = {}) =>
  await api.get(`/players/team/${teamId}`, { params });

export const getPlayer = async (id) => await api.get(`/players/${id}`);

export const createPlayer = async (playerData) =>
  await api.post("/players", playerData);

export const updatePlayer = async (id, playerData) =>
  await api.put(`/players/${id}`, playerData);

export const deletePlayer = async (id) => await api.delete(`/players/${id}`);

export const updatePlayerStatus = async (id, statusData) =>
  await api.put(`/players/${id}/status`, statusData);

// ==================== ENHANCED TEAM API ====================
// export const getTeamStats = async (teamId) =>
//   await api.get(`/teams/${teamId}/stats`);

// export const getTeamMatches = async (teamId, params = {}) =>
//   await api.get(`/teams/${teamId}/matches`, { params });

export const updateTeamInfo = async (teamId, teamData) =>
  await api.put(`/teams/${teamId}`, teamData);

// Fonction pour obtenir les matchs avec filtres avancés
export const getMatchesWithFilters = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.teamId) params.append("teamId", filters.teamId);
  if (filters.reporterId) params.append("reporterId", filters.reporterId);
  if (filters.status && Array.isArray(filters.status)) {
    filters.status.forEach((s) => params.append("status", s));
  } else if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.limit) params.append("limit", filters.limit);

  return await api.get(`/matches?${params.toString()}`);
};

// Fonction pour obtenir les statistiques d'équipe avec cache
let statsCache = new Map();
export const getTeamStatsWithCache = async (teamId) => {
  const cacheKey = `stats-${teamId}`;
  const cached = statsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    // Cache 5 minutes
    return { data: cached.data };
  }

  try {
    const response = await getTeamStats(teamId);
    statsCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    return response;
  } catch (error) {
    // Retourner des stats par défaut si erreur
    const defaultStats = {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      position: null,
    };
    return { data: defaultStats };
  }
};

// Fonction pour obtenir les événements avec pagination
export const getMatchEventsWithPagination = async (
  matchId,
  page = 1,
  limit = 50
) => {
  try {
    const response = await api.get(`/matches/${matchId}/events`, {
      params: { page, limit, sort: "minute,desc" },
    });
    return response;
  } catch (error) {
    console.error("Erreur lors du chargement des événements:", error);
    return { data: [] };
  }
};

// Fonction pour obtenir les logos d'équipes
export const getTeamLogos = async () => {
  try {
    const response = await api.get("/upload/logos");
    return response;
  } catch (error) {
    console.error("Erreur lors du chargement des logos:", error);
    return { data: [] };
  }
};

// Fonction pour valider et nettoyer les données d'événement
export const validateEventData = (eventData) => {
  const errors = [];

  if (!eventData.type) errors.push("Type d'événement requis");
  if (!eventData.teamId) errors.push("Équipe requise");
  if (!eventData.minute || eventData.minute < 0 || eventData.minute > 120) {
    errors.push("Minute invalide (0-120)");
  }

  if (
    ["goal", "yellow_card", "red_card"].includes(eventData.type) &&
    !eventData.playerName
  ) {
    errors.push("Nom du joueur requis pour ce type d'événement");
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanData: {
      ...eventData,
      teamId: parseInt(eventData.teamId),
      minute: parseInt(eventData.minute),
      playerId: eventData.playerId ? parseInt(eventData.playerId) : null,
    },
  };
};

export default api;
