const express = require("express");
const router = express.Router();
const db = require("../models");

// GET all matches
router.get("/", async (req, res) => {
  try {
    const matches = await db.Match.findAll({
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        {
          model: db.Event,
          as: "events",
          include: [{ model: db.Team, as: "team" }],
        },
      ],
      order: [["startAt", "ASC"]],
    });

    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /matches
// body: { homeTeamId OR homeTeamName, awayTeamId OR awayTeamName, startAt }
// router.post('/', async (req, res) => {
//   try {
//     const { homeTeamId, awayTeamId, homeTeamName, awayTeamName, startAt } = req.body;
//     let homeId = homeTeamId;
//     let awayId = awayTeamId;

//     if (!homeId && homeTeamName) {
//       const t = await db.Team.create({ name: homeTeamName });
//       homeId = t.id;
//     }
//     if (!awayId && awayTeamName) {
//       const t = await db.Team.create({ name: awayTeamName });
//       awayId = t.id;
//     }

//     if (!homeId || !awayId) return res.status(400).json({ error: 'Teams required' });

//     const match = await db.Match.create({
//       homeTeamId: homeId,
//       awayTeamId: awayId,
//       homeScore: 0,
//       awayScore: 0,
//       status: 'scheduled',
//       startAt: startAt || new Date()
//     });

//     // eager load and return
//     const newMatch = await db.Match.findByPk(match.id, {
//       include: [{ model: db.Team, as: 'homeTeam' }, { model: db.Team, as: 'awayTeam' }]
//     });

//     // emit list update (optional)
//     req.io.emit('match_created', newMatch);

//     res.status(201).json(newMatch);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// POST create new match
router.post("/", async (req, res) => {
  try {
    const { homeTeamId, awayTeamId, startAt } = req.body;

    // Validation
    if (!homeTeamId || !awayTeamId) {
      return res
        .status(400)
        .json({ error: "homeTeamId and awayTeamId are required" });
    }

    if (homeTeamId === awayTeamId) {
      return res
        .status(400)
        .json({ error: "Home and away teams must be different" });
    }

    // Vérifier que les équipes existent
    const homeTeam = await db.Team.findByPk(homeTeamId);
    const awayTeam = await db.Team.findByPk(awayTeamId);

    if (!homeTeam || !awayTeam) {
      return res.status(404).json({ error: "One or both teams not found" });
    }

    const match = await db.Match.create({
      homeTeamId,
      awayTeamId,
      startAt: startAt || new Date(),
    });

    // Récupérer le match avec les équipes
    const fullMatch = await db.Match.findByPk(match.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
    });

    // emit list update (optional)
    req.io.emit("match_created", fullMatch);

    res.status(201).json(fullMatch);
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET match details
router.get("/:id", async (req, res) => {
  try {
    const match = await db.Match.findByPk(req.params.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        {
          model: db.Event,
          as: "events",
          include: [{ model: db.Team, as: "team" }],
        },
      ],
    });

    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update match
router.put("/:id", async (req, res) => {
  try {
    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    const { homeScore, awayScore, status, startAt } = req.body;

    // Mise à jour des champs modifiables
    const updateData = {};
    if (homeScore !== undefined) updateData.homeScore = homeScore;
    if (awayScore !== undefined) updateData.awayScore = awayScore;
    if (status !== undefined) updateData.status = status;
    if (startAt !== undefined) updateData.startAt = startAt;

    await match.update(updateData);

    // Récupérer le match mis à jour avec les relations
    const updatedMatch = await db.Match.findByPk(match.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
    });

    // Émettre via Socket.IO si disponible
    req.io.to(`match:${match.id}`).emit("match_updated", updatedMatch);
    req.io.emit("match_updated", updatedMatch);

    res.json(updatedMatch);
  } catch (error) {
    console.error("Error updating match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /matches/:id/score
// body: { homeScore, awayScore }
router.put("/:id/score", async (req, res) => {
  try {
    const { homeScore, awayScore } = req.body;
    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    match.homeScore = Number(homeScore) ?? match.homeScore;
    match.awayScore = Number(awayScore) ?? match.awayScore;
    await match.save();

    const updated = await db.Match.findByPk(match.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
      ],
    });

    // emit to room and global listeners
    req.io.to(`match:${match.id}`).emit("match_updated", updated);
    req.io.emit("match_updated", updated);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE match
router.delete("/:id", async (req, res) => {
  try {
    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Supprimer les événements associés d'abord
    await db.Event.destroy({ where: { matchId: match.id } });

    // Supprimer le match
    await match.destroy();

    req.io.emit("match_deleted", match.id);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST add event to match
router.post("/:id/events", async (req, res) => {
  try {
    const { type, teamId, player, minute } = req.body;

    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Validation
    if (!type || !teamId || minute === undefined) {
      return res
        .status(400)
        .json({ error: "type, teamId, and minute are required" });
    }

    // Vérifier que l'équipe appartient au match
    if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
      return res.status(400).json({ error: "Team is not part of this match" });
    }

    const event = await db.Event.create({
      matchId: match.id,
      type,
      teamId,
      player,
      minute,
    });

    if (type === "home_goal") {
      match.homeScore += 1;
      await match.save();
    } else if (type === "away_goal") {
      match.awayScore += 1;
      await match.save();
    }

    const updatedMatch = await db.Match.findByPk(match.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        {
          model: db.Event,
          as: "events",
          include: [{ model: db.Team, as: "team" }],
        },
      ],
    });

    req.io
      .to(`match:${match.id}`)
      .emit("match:event", { match: updatedMatch, event });
    req.io.emit("match:event", { match: updatedMatch, event }); // global
    req.io.to(`match:${match.id}`).emit("match_updated", updatedMatch);
    req.io.emit("match_updated", updatedMatch);

    res.status(201).json({ event, match: updatedMatch });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET events for a match
router.get("/:id/events", async (req, res) => {
  try {
    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    const events = await db.Event.findAll({
      where: { matchId: req.params.id },
      include: [{ model: db.Team, as: "team" }],
      order: [["minute", "ASC"]],
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Démarrer un match
router.post("/:id/start", async (req, res) => {
  try {
    const result = await req.app.get("timerService").startMatch(req.params.id);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT start match (change status to 'live')
router.put("/:id/start", async (req, res) => {
  try {
    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    if (match.status !== "scheduled") {
      return res
        .status(400)
        .json({ error: "Match can only be started if scheduled" });
    }

    await match.update({ status: "live", startAt: new Date() });

    const updatedMatch = await db.Match.findByPk(match.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
    });

    if (req.io) {
      req.io.to(`match:${match.id}`).emit("match:started", updatedMatch);
    }

    req.io.to(`match:${match.id}`).emit("match_updated", updatedMatch);
    req.io.emit("match_updated", updatedMatch);

    res.json(updatedMatch);
  } catch (error) {
    console.error("Error starting match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mettre en pause
router.post("/:id/pause", async (req, res) => {
  try {
    const result = await req.app.get("timerService").pauseMatch(req.params.id);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Reprendre
router.post("/:id/resume", async (req, res) => {
  try {
    const result = await req.app.get("timerService").resumeMatch(req.params.id);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Démarrer la seconde mi-temps
router.post("/:id/second-half", async (req, res) => {
  try {
    const result = await req.app
      .get("timerService")
      .startSecondHalf(req.params.id);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT finish match (change status to 'finished')
router.put("/:id/finish", async (req, res) => {
  try {
    const match = await db.Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    if (match.status !== "live") {
      return res
        .status(400)
        .json({ error: "Match can only be finished if live" });
    }

    await match.update({ status: "finished" });

    const updatedMatch = await db.Match.findByPk(match.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
    });

    if (req.io) {
      req.io.to(`match:${match.id}`).emit("match:finished", updatedMatch);
    }

    req.io.to(`match:${match.id}`).emit("match_updated", updatedMatch);
    req.io.emit("match_updated", updatedMatch);

    res.json(updatedMatch);
  } catch (error) {
    console.error("Error finishing match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Terminer le match
router.post("/:id/end", async (req, res) => {
  try {
    const result = await req.app.get("timerService").endMatch(req.params.id);
    const updatedMatch = await db.Match.findByPk(req.params.id, {
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
    });
    if (req.io) {
      req.io.to(`match:${req.params.id}`).emit("match:finished", updatedMatch);
    }

    req.io.to(`match:${req.params.id}`).emit("match_updated", updatedMatch);
    req.io.emit("match_updated", updatedMatch);
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Définir le temps additionnel
router.post("/:id/additional-time", async (req, res) => {
  try {
    const { half, minutes } = req.body;
    const result = await req.app
      .get("timerService")
      .setAdditionalTime(req.params.id, half, minutes);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir l'état actuel du match
router.get("/:id/timer", async (req, res) => {
  try {
    const state = req.app
      .get("timerService")
      .getMatchState(parseInt(req.params.id));

    if (state) {
      res.json(state);
    } else {
      res.status(404).json({ error: "État du match non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
