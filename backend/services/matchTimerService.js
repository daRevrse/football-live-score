const { Match, Event } = require("../models");
const { Op } = require("sequelize");

class MatchTimerService {
  constructor(io) {
    this.io = io; // Socket.io instance
    this.activeTimers = new Map(); // Stocke les timers actifs
    this.matchStates = new Map(); // État de chaque match

    // Démarre le service
    this.initializeService();
  }

  async initializeService() {
    console.log("🚀 Initialisation du service de chrono des matchs...");

    // Récupère tous les matchs en cours au démarrage
    await this.recoverActiveMatches();

    // Lance le timer global (toutes les secondes)
    this.startGlobalTimer();
  }

  async recoverActiveMatches() {
    try {
      const activeMatches = await Match.findAll({
        where: {
          status: ["live", "paused"],
        },
        include: ["homeTeam", "awayTeam"],
      });

      console.log(`📊 ${activeMatches.length} match(s) actif(s) récupéré(s)`);

      for (const match of activeMatches) {
        await this.initializeMatchTimer(match);
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des matchs actifs:",
        error
      );
    }
  }

  async initializeMatchTimer(match) {
    const matchState = {
      id: match.id,
      status: match.status,
      kickoffTime: match.kickoffTime,
      firstHalfStart: match.firstHalfStart,
      secondHalfStart: match.secondHalfStart,
      pausedAt: match.pausedAt,
      totalPausedTime: match.totalPausedTime || 0,
      currentMinute: match.currentMinute || 0,
      currentSecond: match.currentSecond || 0,
      additionalTimeFirstHalf: match.additionalTimeFirstHalf || 0,
      additionalTimeSecondHalf: match.additionalTimeSecondHalf || 0,
    };

    this.matchStates.set(match.id, matchState);
    console.log(`⚽ Timer initialisé pour le match ${match.id}`);
  }

  startGlobalTimer() {
    // Timer global qui s'exécute toutes les secondes
    setInterval(() => {
      this.updateAllMatches();
    }, 1000);
  }

  async updateAllMatches() {
    for (const [matchId, state] of this.matchStates.entries()) {
      if (state.status === "live") {
        await this.updateMatchTime(matchId);
      }
    }
  }

  async updateMatchTime(matchId) {
    const numericMatchId = Number(matchId);
    const state = this.matchStates.get(numericMatchId);
    if (!state || state.status === "finished") return;

    try {
      const now = new Date();
      let totalElapsedSeconds = 0;

      // Calcul du temps écoulé selon la période
      if (state.firstHalfStart && !state.secondHalfStart) {
        // Première mi-temps
        totalElapsedSeconds =
          Math.floor((now - state.firstHalfStart) / 1000) -
          state.totalPausedTime;

        if (totalElapsedSeconds >= 45 * 60) {
          // Temps additionnel première mi-temps
          const additionalSeconds = totalElapsedSeconds - 45 * 60;
          state.currentMinute = 45;
          state.currentSecond = additionalSeconds;
        } else {
          state.currentMinute = Math.floor(totalElapsedSeconds / 60);
          state.currentSecond = totalElapsedSeconds % 60;
        }
      } else if (state.secondHalfStart) {
        // Deuxième mi-temps
        const firstHalfTime = 45 * 60; // 45 minutes en secondes
        const secondHalfElapsed =
          Math.floor((now - state.secondHalfStart) / 1000) -
          state.totalPausedTime;

        totalElapsedSeconds = firstHalfTime + secondHalfElapsed;

        if (secondHalfElapsed >= 45 * 60) {
          // Temps additionnel deuxième mi-temps
          const additionalSeconds = secondHalfElapsed - 45 * 60;
          state.currentMinute = 90;
          state.currentSecond = additionalSeconds;
        } else {
          const totalMinutes = 45 + Math.floor(secondHalfElapsed / 60);
          state.currentMinute = totalMinutes;
          state.currentSecond = secondHalfElapsed % 60;
        }
      }

      // Mise à jour en base toutes les 10 secondes pour éviter la surcharge
      if (state.currentSecond % 10 === 0) {
        await Match.update(
          {
            currentMinute: state.currentMinute,
            currentSecond: state.currentSecond,
          },
          {
            where: { id: matchId },
          }
        );
      }

      // Émission du temps via Socket.IO
      this.io.to(`match:${matchId}`).emit("match:timer", {
        matchId,
        currentMinute: state.currentMinute,
        currentSecond: state.currentSecond,
        status: state.status,
      });

      // Vérification de fin de match automatique
      await this.checkMatchEnd(matchId, state);
    } catch (error) {
      console.error(`❌ Erreur mise à jour timer match ${matchId}:`, error);
    }
  }

  async checkMatchEnd(matchId, state) {
    // Logique de fin de match automatique (peut être personnalisée)
    const shouldEndMatch =
      state.currentMinute >= 90 &&
      state.currentSecond >= state.additionalTimeSecondHalf * 60;

    if (shouldEndMatch && state.status === "live") {
      await this.endMatch(matchId);
    }
  }

  // ========================================
  // MÉTHODES DE CONTRÔLE DU MATCH
  // ========================================

  async startMatch(matchId) {
    try {
      const match = await Match.findByPk(matchId);
      if (!match) throw new Error("Match non trouvé");

      const now = new Date();

      await Match.update(
        {
          status: "live",
          kickoffTime: now,
          firstHalfStart: now,
        },
        { where: { id: matchId } }
      );

      // Initialise le timer
      await this.initializeMatchTimer(await Match.findByPk(matchId));

      // Événement de début de match
      await Event.create({
        matchId,
        type: "kickoff",
        minute: 0,
        // description: "Coup d'envoi",
      });

      this.io.emit("match:started", { matchId, startTime: now });
      console.log(`🟢 Match ${matchId} démarré`);

      return { success: true, message: "Match démarré" };
    } catch (error) {
      console.error("❌ Erreur démarrage match:", error);
      return { success: false, error: error.message };
    }
  }

  async pauseMatch(matchId) {
    try {
      const numericMatchId = Number(matchId);
      const state = this.matchStates.get(numericMatchId);

      if (!state || state.status !== "live") {
        throw new Error("Match non actif");
      }

      const now = new Date();

      await Match.update(
        {
          status: "paused",
          pausedAt: now,
        },
        { where: { id: matchId } }
      );

      state.status = "paused";
      state.pausedAt = now;

      this.io.to(`match:${matchId}`).emit("match:paused", { matchId });
      console.log(`⏸️ Match ${matchId} mis en pause`);

      return { success: true, message: "Match mis en pause" };
    } catch (error) {
      console.error("❌ Erreur pause match:", error);
      return { success: false, error: error.message };
    }
  }

  async resumeMatch(matchId) {
    try {
      const numericMatchId = Number(matchId);
      const state = this.matchStates.get(numericMatchId);
      if (!state || state.status !== "paused") {
        throw new Error("Match non en pause");
      }

      const now = new Date();
      const pauseDuration = Math.floor((now - state.pausedAt) / 1000);

      await Match.update(
        {
          status: "live",
          totalPausedTime: state.totalPausedTime + pauseDuration,
          pausedAt: null,
        },
        { where: { id: matchId } }
      );

      state.status = "live";
      state.totalPausedTime += pauseDuration;
      state.pausedAt = null;

      this.io.to(`match:${matchId}`).emit("match:resumed", { matchId });
      console.log(`▶️ Match ${matchId} repris`);

      return { success: true, message: "Match repris" };
    } catch (error) {
      console.error("❌ Erreur reprise match:", error);
      return { success: false, error: error.message };
    }
  }

  async startSecondHalf(matchId) {
    try {
      const numericMatchId = Number(matchId);
      const state = this.matchStates.get(numericMatchId);
      if (!state) throw new Error("Match non trouvé");

      const now = new Date();

      await Match.update(
        {
          secondHalfStart: now,
          status: "live",
        },
        { where: { id: matchId } }
      );

      state.secondHalfStart = now;
      state.status = "live";

      await Event.create({
        matchId,
        type: "second_half_start",
        minute: 45,
        description: "Début de la seconde mi-temps",
      });

      this.io
        .to(`match:${matchId}`)
        .emit("match:second_half_started", { matchId });
      console.log(`🔄 Seconde mi-temps démarrée pour le match ${matchId}`);

      return { success: true, message: "Seconde mi-temps démarrée" };
    } catch (error) {
      console.error("❌ Erreur début seconde mi-temps:", error);
      return { success: false, error: error.message };
    }
  }

  async endMatch(matchId) {
    try {
      const numericMatchId = Number(matchId);
      const state = this.matchStates.get(numericMatchId);
      if (!state) throw new Error("Match non trouvé");

      await Match.update(
        {
          status: "finished",
        },
        { where: { id: matchId } }
      );

      // Supprime le timer actif
      this.matchStates.delete(numericMatchId);

      await Event.create({
        matchId,
        type: "full_time",
        minute: state.currentMinute,
        description: "Fin du match",
      });

      this.io.emit("match:finished", { matchId });
      console.log(`🏁 Match ${matchId} terminé`);

      return { success: true, message: "Match terminé" };
    } catch (error) {
      console.error("❌ Erreur fin de match:", error);
      return { success: false, error: error.message };
    }
  }

  async setAdditionalTime(matchId, half, minutes) {
    try {
      const field =
        half === 1 ? "additionalTimeFirstHalf" : "additionalTimeSecondHalf";

      await Match.update(
        {
          [field]: minutes,
        },
        { where: { id: matchId } }
      );

      const numericMatchId = Number(matchId);
      const state = this.matchStates.get(numericMatchId);
      if (state) {
        state[field] = minutes;
      }

      this.io.to(`match:${matchId}`).emit("match:additional_time", {
        matchId,
        half,
        minutes,
      });

      return {
        success: true,
        message: `Temps additionnel défini: ${minutes} min`,
      };
    } catch (error) {
      console.error("❌ Erreur temps additionnel:", error);
      return { success: false, error: error.message };
    }
  }

  // Getter pour obtenir l'état actuel d'un match
  getMatchState(matchId) {
    return this.matchStates.get(matchId);
  }

  // Getter pour obtenir tous les matchs actifs
  getActiveMatches() {
    return Array.from(this.matchStates.values());
  }
}

module.exports = MatchTimerService;
