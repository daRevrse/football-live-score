const express = require("express");
const router = express.Router();
const db = require("../models");
const { Op } = require("sequelize"); // Import manquant

// Vérification hex color (améliorée)
const isHexColor = (color) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

// Validation des données d'équipe
const validateTeamData = (data) => {
  const errors = [];

  if (!data.name || !data.name.trim()) {
    errors.push("Name is required");
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.push("Name must be between 2 and 100 characters");
  }

  if (!data.shortName || !data.shortName.trim()) {
    errors.push("Short name is required");
  } else if (
    data.shortName.trim().length < 1 ||
    data.shortName.trim().length > 10
  ) {
    errors.push("Short name must be between 1 and 10 characters");
  }

  if (data.logoUrl && !/^https?:\/\/.+/i.test(data.logoUrl)) {
    errors.push("Invalid logo URL format");
  }

  if (data.primaryColor && !isHexColor(data.primaryColor)) {
    errors.push("Invalid primary color format (must be hex color)");
  }

  if (data.secondaryColor && !isHexColor(data.secondaryColor)) {
    errors.push("Invalid secondary color format (must be hex color)");
  }

  return errors;
};

// GET all teams avec pagination et recherche
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "name",
      sortOrder = "ASC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { shortName: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const validSortFields = ["name", "shortName", "createdAt"];
    const validSortOrders = ["ASC", "DESC"];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "name";
    const orderDirection = validSortOrders.includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    const { count, rows: teams } = await db.Team.findAndCountAll({
      where: whereClause,
      order: [[orderField, orderDirection]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      teams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create new team
router.post("/", async (req, res) => {
  try {
    const { name, shortName, logoUrl, primaryColor, secondaryColor } = req.body;

    // Validation des données
    const validationErrors = validateTeamData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Vérifier l'unicité
    const existingTeam = await db.Team.findOne({
      where: {
        [Op.or]: [
          { name: name.trim() },
          { shortName: shortName.trim().toUpperCase() },
        ],
      },
    });

    if (existingTeam) {
      const conflictField =
        existingTeam.name === name.trim() ? "name" : "shortName";
      return res.status(409).json({
        error: `Team ${conflictField} already exists`,
        field: conflictField,
      });
    }

    const team = await db.Team.create({
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      logoUrl: logoUrl?.trim() || null,
      primaryColor: primaryColor?.trim() || null,
      secondaryColor: secondaryColor?.trim() || null,
    });

    req.io.emit("team_created", team);

    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);

    // Gestion des erreurs Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Duplicate entry",
        field: error.errors[0]?.path,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update team
router.put("/:id", async (req, res) => {
  try {
    const { name, shortName, logoUrl, primaryColor, secondaryColor } = req.body;

    // Vérifier que l'équipe existe
    const team = await db.Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Validation des données
    const validationErrors = validateTeamData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Vérifier l'unicité (exclure l'équipe actuelle)
    const existingTeam = await db.Team.findOne({
      where: {
        id: { [Op.ne]: req.params.id },
        [Op.or]: [
          { name: name.trim() },
          { shortName: shortName.trim().toUpperCase() },
        ],
      },
    });

    if (existingTeam) {
      const conflictField =
        existingTeam.name === name.trim() ? "name" : "shortName";
      return res.status(409).json({
        error: `Team ${conflictField} already exists`,
        field: conflictField,
      });
    }

    const updatedTeam = await team.update({
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      logoUrl: logoUrl?.trim() || null,
      primaryColor: primaryColor?.trim() || null,
      secondaryColor: secondaryColor?.trim() || null,
    });

    req.io.emit("team_updated", updatedTeam);

    res.json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);

    // Gestion des erreurs Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team by ID avec relations optionnelles
router.get("/:id", async (req, res) => {
  try {
    const { include } = req.query;
    const includeOptions = [];

    if (include) {
      const includeArray = include.split(",");
      if (includeArray.includes("matches")) {
        includeOptions.push(
          { model: db.Match, as: "homeMatches" },
          { model: db.Match, as: "awayMatches" }
        );
      }
      if (includeArray.includes("events")) {
        includeOptions.push({ model: db.Event, as: "events" });
      }
    }

    const team = await db.Team.findByPk(req.params.id, {
      include: includeOptions,
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE team avec vérifications étendues
router.delete("/:id", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Vérifier si l'équipe est utilisée dans des matches
    const matchCount = await db.Match.count({
      where: {
        [Op.or]: [{ homeTeamId: req.params.id }, { awayTeamId: req.params.id }],
      },
    });

    if (matchCount > 0) {
      return res.status(409).json({
        error: "Cannot delete team that has matches",
        details: `Team has ${matchCount} associated match(es)`,
        suggestion: "Delete or reassign matches first",
      });
    }

    // Vérifier si l'équipe a des événements
    const eventCount = await db.Event.count({
      where: { teamId: req.params.id },
    });

    if (eventCount > 0) {
      return res.status(409).json({
        error: "Cannot delete team that has events",
        details: `Team has ${eventCount} associated event(s)`,
        suggestion: "Delete or reassign events first",
      });
    }

    await team.destroy();

    req.io.emit("team_deleted", team.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team matches (toutes les variations) - Version consolidée
router.get("/:id/matches", async (req, res) => {
  try {
    const { type = "all", status, limit = 20, page = 1 } = req.query;

    const team = await db.Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    let whereClause = {};

    // Filtrer par type de match
    switch (type) {
      case "home":
        whereClause.homeTeamId = req.params.id;
        break;
      case "away":
        whereClause.awayTeamId = req.params.id;
        break;
      default: // "all"
        whereClause[Op.or] = [
          { homeTeamId: req.params.id },
          { awayTeamId: req.params.id },
        ];
    }

    // Filtrer par statut si spécifié
    if (status) {
      whereClause.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: matches } = await db.Match.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
        { model: db.Event, as: "events" },
      ],
      order: [["startAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      matches,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching team matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team statistics (améliorées)
router.get("/:id/stats", async (req, res) => {
  try {
    const { season, competition } = req.query;

    const team = await db.Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    let whereClause = {
      status: "finished",
      [Op.or]: [{ homeTeamId: req.params.id }, { awayTeamId: req.params.id }],
    };

    // Filtres optionnels
    if (season) whereClause.season = season;
    if (competition) whereClause.competition = competition;

    const matches = await db.Match.findAll({
      where: whereClause,
      order: [["startAt", "ASC"]],
    });

    let wins = 0,
      draws = 0,
      losses = 0;
    let goalsFor = 0,
      goalsAgainst = 0;
    let homeWins = 0,
      awayWins = 0;
    let form = []; // Derniers 5 résultats

    matches.forEach((match) => {
      const isHome = match.homeTeamId == req.params.id;
      const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
      const opponentScore = isHome
        ? match.awayScore || 0
        : match.homeScore || 0;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      let result;
      if (teamScore > opponentScore) {
        wins++;
        if (isHome) homeWins++;
        else awayWins++;
        result = "W";
      } else if (teamScore === opponentScore) {
        draws++;
        result = "D";
      } else {
        losses++;
        result = "L";
      }

      // Garde seulement les 5 derniers résultats
      form.push(result);
      if (form.length > 5) form.shift();
    });

    const stats = {
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
      },
      overall: {
        matchesPlayed: matches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
        winPercentage:
          matches.length > 0 ? ((wins / matches.length) * 100).toFixed(1) : 0,
      },
      home: {
        wins: homeWins,
        percentage: wins > 0 ? ((homeWins / wins) * 100).toFixed(1) : 0,
      },
      away: {
        wins: awayWins,
        percentage: wins > 0 ? ((awayWins / wins) * 100).toFixed(1) : 0,
      },
      form: form.reverse(), // Plus récent en premier
      averages: {
        goalsForPerMatch:
          matches.length > 0 ? (goalsFor / matches.length).toFixed(2) : 0,
        goalsAgainstPerMatch:
          matches.length > 0 ? (goalsAgainst / matches.length).toFixed(2) : 0,
        pointsPerMatch:
          matches.length > 0
            ? ((wins * 3 + draws) / matches.length).toFixed(2)
            : 0,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching team stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET teams leaderboard/ranking
router.get("/leaderboard", async (req, res) => {
  try {
    const { season, competition, limit = 20 } = req.query;

    const teams = await db.Team.findAll({
      order: [["name", "ASC"]],
    });

    const leaderboard = [];

    for (const team of teams) {
      let whereClause = {
        status: "finished",
        [Op.or]: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
      };

      if (season) whereClause.season = season;
      if (competition) whereClause.competition = competition;

      const matches = await db.Match.findAll({ where: whereClause });

      let wins = 0,
        draws = 0,
        losses = 0;
      let goalsFor = 0,
        goalsAgainst = 0;

      matches.forEach((match) => {
        const isHome = match.homeTeamId === team.id;
        const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
        const opponentScore = isHome
          ? match.awayScore || 0
          : match.homeScore || 0;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) wins++;
        else if (teamScore === opponentScore) draws++;
        else losses++;
      });

      if (matches.length > 0) {
        // Inclure seulement les équipes qui ont joué
        leaderboard.push({
          team: {
            id: team.id,
            name: team.name,
            shortName: team.shortName,
            logoUrl: team.logoUrl,
          },
          matchesPlayed: matches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points: wins * 3 + draws,
        });
      }
    }

    // Trier par points, puis par différence de buts, puis par buts marqués
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Ajouter la position
    leaderboard.forEach((entry, index) => {
      entry.position = index + 1;
    });

    res.json(leaderboard.slice(0, parseInt(limit)));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
