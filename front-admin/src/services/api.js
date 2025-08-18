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
export const finishMatch = async (id) => await api.put(`/matches/${id}/finish`);
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
// Fonctions utilitaires pour les matchs
export const getLiveMatches = async () => {
  const response = await getMatches({ status: "live" });
  return response.data;
};

export const getUpcomingMatches = async () => {
  const response = await getMatches({ status: "scheduled" });
  return response.data;
};

export const getCompletedMatches = async () => {
  const response = await getMatches({ status: "completed" });
  return response.data;
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

export default api;
