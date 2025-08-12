const express = require("express");
const router = express.Router();
const db = require("../models");

// GET all teams
router.get("/", async (req, res) => {
  try {
    const teams = await db.Team.findAll({
      order: [["name", "ASC"]],
    });

    res.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create new team
router.post("/", async (req, res) => {
  try {
    const { name, shortName } = req.body;

    // Validation
    if (!name || !shortName) {
      return res.status(400).json({ error: "name and shortName are required" });
    }

    // Vérifier l'unicité du nom
    const existingTeam = await db.Team.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ name: name }, { shortName: shortName }],
      },
    });

    if (existingTeam) {
      return res.status(409).json({
        error: "Team name or short name already exists",
      });
    }

    const team = await db.Team.create({
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
    });

    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team by ID
router.get("/:id", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update team
router.put("/:id", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const { name, shortName } = req.body;

    // Validation
    if (!name || !shortName) {
      return res.status(400).json({ error: "name and shortName are required" });
    }

    // Vérifier l'unicité (exclure l'équipe actuelle)
    const existingTeam = await db.Team.findOne({
      where: {
        id: { [db.Sequelize.Op.ne]: req.params.id },
        [db.Sequelize.Op.or]: [{ name: name }, { shortName: shortName }],
      },
    });

    if (existingTeam) {
      return res.status(409).json({
        error: "Team name or short name already exists",
      });
    }

    await team.update({
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
    });

    res.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE team
router.delete("/:id", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Vérifier si l'équipe est utilisée dans des matches
    const matchCount = await db.Match.count({
      where: {
        [db.Sequelize.Op.or]: [
          { homeTeamId: req.params.id },
          { awayTeamId: req.params.id },
        ],
      },
    });

    if (matchCount > 0) {
      return res.status(409).json({
        error: "Cannot delete team that has matches. Delete matches first.",
      });
    }

    await team.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team matches (as home team)
router.get("/:id/home-matches", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const matches = await db.Match.findAll({
      where: { homeTeamId: req.params.id },
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
      order: [["startAt", "DESC"]],
    });

    res.json(matches);
  } catch (error) {
    console.error("Error fetching home matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team matches (as away team)
router.get("/:id/away-matches", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const matches = await db.Match.findAll({
      where: { awayTeamId: req.params.id },
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
      order: [["startAt", "DESC"]],
    });

    res.json(matches);
  } catch (error) {
    console.error("Error fetching away matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all team matches (home + away)
router.get("/:id/matches", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const matches = await db.Match.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { homeTeamId: req.params.id },
          { awayTeamId: req.params.id },
        ],
      },
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
      order: [["startAt", "DESC"]],
    });

    res.json(matches);
  } catch (error) {
    console.error("Error fetching team matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Récupérer tous les matches terminés
    const matches = await db.Match.findAll({
      where: {
        status: "finished",
        [db.Sequelize.Op.or]: [
          { homeTeamId: req.params.id },
          { awayTeamId: req.params.id },
        ],
      },
    });

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    matches.forEach((match) => {
      const isHome = match.homeTeamId == req.params.id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      goalsFor += teamScore || 0;
      goalsAgainst += opponentScore || 0;

      if (teamScore > opponentScore) wins++;
      else if (teamScore === opponentScore) draws++;
      else losses++;
    });

    const stats = {
      team: team,
      matchesPlayed: matches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching team stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
