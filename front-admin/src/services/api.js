import axios from "axios";

const API_URL = "http://localhost:5000";

// Configuration axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== MATCHES API ====================

// GET all matches
export const getMatches = () => api.get("/matches");

// GET match by ID
export const getMatch = (id) => api.get(`/matches/${id}`);

// POST create new match
export const createMatch = (matchData) => api.post("/matches", matchData);

// PUT update match
export const updateMatch = (id, matchData) =>
  api.put(`/matches/${id}`, matchData);

// DELETE match
export const deleteMatch = (id) => api.delete(`/matches/${id}`);

// PUT update score (ta fonction existante adaptée)
export const updateScore = (id, homeScore, awayScore) =>
  api.put(`/matches/${id}/score`, { homeScore, awayScore });

// PUT start match
export const startMatch = (id) => api.put(`/matches/${id}/start`);

// PUT finish match
export const finishMatch = (id) => api.put(`/matches/${id}/finish`);

// ==================== MATCH EVENTS API ====================

// GET events for a match
export const getMatchEvents = (matchId) =>
  api.get(`/matches/${matchId}/events`);

// POST add event to match
export const addMatchEvent = (matchId, eventData) =>
  api.post(`/matches/${matchId}/events`, eventData);

// ==================== TEAMS API ====================

// GET all teams
export const getTeams = () => api.get("/teams");

// GET team by ID
export const getTeam = (id) => api.get(`/teams/${id}`);

// POST create new team
export const createTeam = (teamData) => api.post("/teams", teamData);

// PUT update team
export const updateTeam = (id, teamData) => api.put(`/teams/${id}`, teamData);

// DELETE team
export const deleteTeam = (id) => api.delete(`/teams/${id}`);

// GET team matches
export const getTeamMatches = (id) => api.get(`/teams/${id}/matches`);

// GET team home matches
export const getTeamHomeMatches = (id) => api.get(`/teams/${id}/home-matches`);

// GET team away matches
export const getTeamAwayMatches = (id) => api.get(`/teams/${id}/away-matches`);

// GET team statistics
export const getTeamStats = (id) => api.get(`/teams/${id}/stats`);

// ==================== HELPER FUNCTIONS ====================

// Fonction pour créer un match complet avec validation
export const createCompleteMatch = async (
  homeTeamId,
  awayTeamId,
  startAt = null
) => {
  try {
    const matchData = {
      homeTeamId: parseInt(homeTeamId),
      awayTeamId: parseInt(awayTeamId),
      startAt: startAt || new Date().toISOString(),
    };

    return await createMatch(matchData);
  } catch (error) {
    throw new Error(
      `Erreur lors de la création du match: ${
        error.response?.data?.error || error.message
      }`
    );
  }
};

// Fonction pour ajouter un but
export const addGoal = async (matchId, teamId, player = null, minute) => {
  try {
    const eventData = {
      type: "goal",
      teamId: parseInt(teamId),
      player: player || "Joueur inconnu",
      minute: parseInt(minute),
    };

    return await addMatchEvent(matchId, eventData);
  } catch (error) {
    throw new Error(
      `Erreur lors de l'ajout du but: ${
        error.response?.data?.error || error.message
      }`
    );
  }
};

// Fonction pour ajouter un carton
export const addCard = async (
  matchId,
  teamId,
  player,
  minute,
  cardType = "yellow"
) => {
  try {
    const eventData = {
      type: cardType === "red" ? "red_card" : "yellow_card",
      teamId: parseInt(teamId),
      player,
      minute: parseInt(minute),
    };

    return await addMatchEvent(matchId, eventData);
  } catch (error) {
    throw new Error(
      `Erreur lors de l'ajout du carton: ${
        error.response?.data?.error || error.message
      }`
    );
  }
};

// Fonction pour récupérer le classement (basé sur les statistiques des équipes)
export const getLeaderboard = async () => {
  try {
    const teamsResponse = await getTeams();
    const teams = teamsResponse.data;

    // Récupérer les stats pour chaque équipe
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        try {
          const statsResponse = await getTeamStats(team.id);
          return { ...team, stats: statsResponse.data };
        } catch (error) {
          return { ...team, stats: null };
        }
      })
    );

    // Trier par points, puis par différence de buts
    return teamsWithStats
      .filter((team) => team.stats !== null)
      .sort((a, b) => {
        if (b.stats.points !== a.stats.points) {
          return b.stats.points - a.stats.points;
        }
        return b.stats.goalDifference - a.stats.goalDifference;
      });
  } catch (error) {
    throw new Error(
      `Erreur lors de la récupération du classement: ${error.message}`
    );
  }
};

// Fonction pour récupérer les matches du jour
export const getTodayMatches = async () => {
  try {
    const response = await getMatches();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return response.data.filter((match) => {
      const matchDate = new Date(match.startAt);
      return matchDate >= today && matchDate < tomorrow;
    });
  } catch (error) {
    throw new Error(
      `Erreur lors de la récupération des matches du jour: ${error.message}`
    );
  }
};

// Fonction pour récupérer les matches live
export const getLiveMatches = async () => {
  try {
    const response = await getMatches();
    return response.data.filter((match) => match.status === "live");
  } catch (error) {
    throw new Error(
      `Erreur lors de la récupération des matches en direct: ${error.message}`
    );
  }
};

// ==================== EXPORT DEFAULT ====================

// Export d'un objet avec toutes les fonctions pour une utilisation plus propre
// export default {
//   // Matches
//   matches: {
//     getAll: getMatches,
//     getById: getMatch,
//     create: createMatch,
//     update: updateMatch,
//     delete: deleteMatch,
//     updateScore,
//     start: startMatch,
//     finish: finishMatch,
//     createComplete: createCompleteMatch,
//     getToday: getTodayMatches,
//     getLive: getLiveMatches,
//   },

//   // Events
//   events: {
//     getMatchEvents,
//     addEvent: addMatchEvent,
//     addGoal,
//     addCard,
//   },

//   // Teams
//   teams: {
//     getAll: getTeams,
//     getById: getTeam,
//     create: createTeam,
//     update: updateTeam,
//     delete: deleteTeam,
//     getMatches: getTeamMatches,
//     getHomeMatches: getTeamHomeMatches,
//     getAwayMatches: getTeamAwayMatches,
//     getStats: getTeamStats,
//     getLeaderboard,
//   }
// };
