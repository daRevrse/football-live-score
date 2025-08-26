// backend/routes/players.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const db = require("../models");
const { authenticate, authorize } = require("../middleware/auth");

// Validation des données de joueur
const validatePlayerData = (data, isUpdate = false) => {
  const errors = [];
  const { firstName, lastName, jerseyNumber, position, teamId } = data;

  if (!isUpdate || firstName !== undefined) {
    if (!firstName || !firstName.trim()) {
      errors.push("First name is required");
    } else if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      errors.push("First name must be between 2 and 50 characters");
    }
  }

  if (!isUpdate || lastName !== undefined) {
    if (!lastName || !lastName.trim()) {
      errors.push("Last name is required");
    } else if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      errors.push("Last name must be between 2 and 50 characters");
    }
  }

  if (!isUpdate || jerseyNumber !== undefined) {
    if (!jerseyNumber || jerseyNumber < 1 || jerseyNumber > 99) {
      errors.push("Jersey number must be between 1 and 99");
    }
  }

  if (!isUpdate || position !== undefined) {
    const validPositions = [
      "Gardien",
      "Défenseur central",
      "Latéral droit",
      "Latéral gauche",
      "Milieu défensif",
      "Milieu central",
      "Milieu offensif",
      "Ailier droit",
      "Ailier gauche",
      "Attaquant",
      "Avant-centre",
    ];

    if (!position || !validPositions.includes(position)) {
      errors.push("Invalid position");
    }
  }

  if (!isUpdate || teamId !== undefined) {
    if (!teamId) {
      errors.push("Team ID is required");
    }
  }

  return errors;
};

// Middleware pour vérifier les permissions sur une équipe
const checkTeamPermission = async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.teamId;

    // Admin peut tout faire
    if (req.user.role === "Admin") {
      return next();
    }

    // Manager peut gérer sa propre équipe
    if (req.user.role === "Manager" && req.user.teamId == teamId) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied. You can only manage players from your own team.",
    });
  } catch (error) {
    console.error("Error checking team permission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET all players avec filtres
router.get("/", async (req, res) => {
  try {
    const {
      teamId,
      position,
      status = "active",
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const whereClause = {};

    if (teamId) whereClause.teamId = teamId;
    if (position) whereClause.position = position;
    if (status) whereClause.status = status;

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: players } = await db.Player.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Team,
          as: "team",
          attributes: ["id", "name", "shortName", "logoUrl"],
        },
      ],
      order: [
        ["teamId", "ASC"],
        ["jerseyNumber", "ASC"],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      players,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET players d'une équipe spécifique
router.get("/team/:teamId", async (req, res) => {
  try {
    const { position, status } = req.query;
    const whereClause = { teamId: req.params.teamId };

    if (position) whereClause.position = position;
    if (status) whereClause.status = status;

    const players = await db.Player.findAll({
      where: whereClause,
      include: [
        {
          model: db.Team,
          as: "team",
          attributes: ["id", "name", "shortName"],
        },
      ],
      order: [["jerseyNumber", "ASC"]],
    });

    // Grouper par position
    const playersByPosition = players.reduce((acc, player) => {
      if (!acc[player.position]) {
        acc[player.position] = [];
      }
      acc[player.position].push(player);
      return acc;
    }, {});

    res.json({
      players,
      playersByPosition,
      stats: {
        total: players.length,
        active: players.filter((p) => p.status === "active").length,
        injured: players.filter((p) => p.status === "injured").length,
        suspended: players.filter((p) => p.status === "suspended").length,
      },
    });
  } catch (error) {
    console.error("Error fetching team players:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create player (Admin ou Manager de l'équipe)
router.post("/", authenticate, checkTeamPermission, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      jerseyNumber,
      position,
      teamId,
      dateOfBirth,
      nationality,
      height,
      weight,
      photoUrl,
      contractStart,
      contractEnd,
      salary,
      biography,
    } = req.body;

    // Validation
    const validationErrors = validatePlayerData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Vérifier que l'équipe existe
    const team = await db.Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Vérifier l'unicité du numéro de maillot dans l'équipe
    const existingPlayer = await db.Player.findOne({
      where: { teamId, jerseyNumber },
    });

    if (existingPlayer) {
      return res.status(409).json({
        error: `Jersey number ${jerseyNumber} is already taken in this team`,
        field: "jerseyNumber",
      });
    }

    const player = await db.Player.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jerseyNumber,
      position,
      teamId,
      dateOfBirth: dateOfBirth || null,
      nationality: nationality?.trim() || null,
      height: height || null,
      weight: weight || null,
      photoUrl: photoUrl?.trim() || null,
      contractStart: contractStart || null,
      contractEnd: contractEnd || null,
      salary: salary || null,
      biography: biography?.trim() || null,
      status: "active",
    });

    // Récupérer le joueur avec l'équipe
    const fullPlayer = await db.Player.findByPk(player.id, {
      include: [
        {
          model: db.Team,
          as: "team",
          attributes: ["id", "name", "shortName", "logoUrl"],
        },
      ],
    });

    req.io.emit("player_created", fullPlayer);

    res.status(201).json(fullPlayer);
  } catch (error) {
    console.error("Error creating player:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Jersey number already taken in this team",
        field: "jerseyNumber",
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// GET player by ID
router.get("/:id", async (req, res) => {
  try {
    const player = await db.Player.findByPk(req.params.id, {
      include: [
        {
          model: db.Team,
          as: "team",
          attributes: ["id", "name", "shortName", "logoUrl", "primaryColor"],
        },
        {
          model: db.Event,
          as: "events",
          include: [
            {
              model: db.Match,
              as: "match",
              include: [
                {
                  model: db.Team,
                  as: "homeTeam",
                  attributes: ["name", "shortName"],
                },
                {
                  model: db.Team,
                  as: "awayTeam",
                  attributes: ["name", "shortName"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Calculer les statistiques du joueur
    const events = player.events || [];
    const stats = {
      goals: events.filter((e) => e.type === "goal").length,
      assists: events.filter((e) => e.type === "assist").length,
      yellowCards: events.filter((e) => e.type === "yellow_card").length,
      redCards: events.filter((e) => e.type === "red_card").length,
      totalEvents: events.length,
    };

    res.json({
      ...player.toJSON(),
      stats,
      age: player.getAge(),
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update player (Admin ou Manager de l'équipe)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const player = await db.Player.findByPk(req.params.id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Vérifier les permissions
    const canEdit =
      req.user.role === "Admin" ||
      (req.user.role === "Manager" && req.user.teamId == player.teamId);

    if (!canEdit) {
      return res.status(403).json({
        error: "Access denied. You can only manage players from your own team.",
      });
    }

    const { jerseyNumber, teamId, ...otherData } = req.body;

    // Validation
    const validationErrors = validatePlayerData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Vérifier l'unicité du numéro de maillot si modifié
    if (jerseyNumber && jerseyNumber !== player.jerseyNumber) {
      const targetTeamId = teamId || player.teamId;
      const existingPlayer = await db.Player.findOne({
        where: {
          teamId: targetTeamId,
          jerseyNumber,
          id: { [Op.ne]: player.id },
        },
      });

      if (existingPlayer) {
        return res.status(409).json({
          error: `Jersey number ${jerseyNumber} is already taken in this team`,
          field: "jerseyNumber",
        });
      }
    }

    // Mise à jour
    const updateData = { ...otherData };
    if (jerseyNumber) updateData.jerseyNumber = jerseyNumber;
    if (teamId && req.user.role === "Admin") {
      // Seul l'Admin peut changer d'équipe
      updateData.teamId = teamId;
    }

    // Nettoyer les données string
    ["firstName", "lastName", "nationality", "photoUrl", "biography"].forEach(
      (field) => {
        if (updateData[field]) {
          updateData[field] = updateData[field].trim();
        }
      }
    );

    const updatedPlayer = await player.update(updateData);

    // Récupérer avec les relations
    const fullPlayer = await db.Player.findByPk(updatedPlayer.id, {
      include: [
        {
          model: db.Team,
          as: "team",
          attributes: ["id", "name", "shortName", "logoUrl"],
        },
      ],
    });

    req.io.emit("player_updated", fullPlayer);

    res.json(fullPlayer);
  } catch (error) {
    console.error("Error updating player:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE player (Admin ou Manager de l'équipe)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const player = await db.Player.findByPk(req.params.id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Vérifier les permissions
    const canDelete =
      req.user.role === "Admin" ||
      (req.user.role === "Manager" && req.user.teamId == player.teamId);

    if (!canDelete) {
      return res.status(403).json({
        error: "Access denied. You can only manage players from your own team.",
      });
    }

    await player.destroy();

    req.io.emit("player_deleted", { id: player.id, teamId: player.teamId });

    res.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Error deleting player:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update player status (Admin ou Manager de l'équipe)
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "injured", "suspended", "inactive"].includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Must be: active, injured, suspended, or inactive",
      });
    }

    const player = await db.Player.findByPk(req.params.id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Vérifier les permissions
    const canUpdate =
      req.user.role === "Admin" ||
      (req.user.role === "Manager" && req.user.teamId == player.teamId);

    if (!canUpdate) {
      return res.status(403).json({
        error: "Access denied. You can only manage players from your own team.",
      });
    }

    await player.update({ status });

    req.io.emit("player_status_updated", {
      id: player.id,
      teamId: player.teamId,
      status,
    });

    res.json({
      message: `Player status updated to ${status}`,
      player: {
        id: player.id,
        name: player.getFullName(),
        status,
      },
    });
  } catch (error) {
    console.error("Error updating player status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
