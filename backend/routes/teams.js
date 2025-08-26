// backend/routes/teams.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const db = require("../models");
const TeamService = require("../services/TeamService");
const { authenticate, authorize } = require("../middleware/auth");

// Validation des données d'équipe
const validateTeamData = (data) => {
  const errors = [];
  const { name, shortName, slug } = data;

  if (!name || !name.trim()) {
    errors.push("Team name is required");
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push("Team name must be between 2 and 100 characters");
  }

  if (shortName && (shortName.length < 1 || shortName.length > 10)) {
    errors.push("Short name must be between 1 and 10 characters");
  }

  if (slug && !/^[a-z0-9-]+$/i.test(slug)) {
    errors.push("Slug can only contain letters, numbers, and hyphens");
  }

  return errors;
};

// GET all teams avec leurs managers et reporters
router.get("/", async (req, res) => {
  try {
    const { include } = req.query;
    const includeOptions = [
      {
        model: db.User,
        as: "manager",
        attributes: ["id", "username", "email", "status", "lastLogin"],
        required: false,
      },
      {
        model: db.User,
        as: "reporter",
        attributes: ["id", "username", "email", "status", "lastLogin"],
        required: false,
      },
    ];

    // Inclure les matches si demandé
    if (include && include.includes("matches")) {
      includeOptions.push(
        { model: db.Match, as: "homeMatches" },
        { model: db.Match, as: "awayMatches" }
      );
    }

    // Inclure les joueurs si demandé
    if (include && include.includes("players")) {
      includeOptions.push({
        model: db.Player,
        as: "players",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "jerseyNumber",
          "position",
          "status",
        ],
      });
    }

    const teams = await db.Team.findAll({
      include: includeOptions,
      order: [["name", "ASC"]],
    });

    // Enrichir avec les statistiques si demandé
    if (include && include.includes("stats")) {
      const teamsWithStats = await Promise.all(
        teams.map(async (team) => {
          const stats = await TeamService.getTeamStats(team.id);
          return {
            ...team.toJSON(),
            stats,
          };
        })
      );
      return res.json({ teams: teamsWithStats });
    }

    res.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create team avec comptes automatiques (Admin seulement)
router.post("/", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const {
      name,
      shortName,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      ...otherData
    } = req.body;

    // Validation
    const validationErrors = validateTeamData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Préparer les données d'équipe
    const teamData = {
      name: name.trim(),
      shortName: shortName?.trim().toUpperCase() || null,
      slug: slug?.trim().toLowerCase() || null, // Sera généré auto si null
      logoUrl: logoUrl?.trim() || null,
      primaryColor: primaryColor?.trim() || null,
      secondaryColor: secondaryColor?.trim() || null,
      ...otherData,
    };

    // Créer l'équipe avec les comptes automatiques
    const result = await TeamService.createTeamWithAccounts(
      teamData,
      req.user.id
    );

    // Émettre les événements socket
    req.io.emit("team_created", result.team);
    req.io.emit("user_created", result.manager);
    req.io.emit("user_created", result.reporter);

    // Retourner la réponse avec les credentials
    res.status(201).json({
      team: result.team,
      accounts: {
        manager: {
          id: result.manager.id,
          username: result.manager.username,
          email: result.manager.email,
          role: result.manager.role,
        },
        reporter: {
          id: result.reporter.id,
          username: result.reporter.username,
          email: result.reporter.email,
          role: result.reporter.role,
        },
      },
      credentials: result.credentials, // Inclure les mots de passe temporaires
      message:
        "Équipe créée avec succès. Les credentials ont été envoyés par email.",
    });
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
      const field = error.errors[0]?.path;
      return res.status(409).json({
        error: `${field} already exists`,
        field: field,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// GET team by ID avec relations étendues
router.get("/:id", async (req, res) => {
  try {
    const { include } = req.query;
    const includeOptions = [
      {
        model: db.User,
        as: "manager",
        attributes: { exclude: ["password"] },
        required: false,
      },
      {
        model: db.User,
        as: "reporter",
        attributes: { exclude: ["password"] },
        required: false,
      },
    ];

    if (include) {
      const includeArray = include.split(",");

      if (includeArray.includes("matches")) {
        includeOptions.push({
          model: db.Match,
          as: "awayMatches",
          include: [{ model: db.Team, as: "homeTeam" }],
        });
      }

      if (includeArray.includes("players")) {
        includeOptions.push({
          model: db.Player,
          as: "players",
          order: [["jerseyNumber", "ASC"]],
        });
      }

      if (includeArray.includes("events")) {
        includeOptions.push({
          model: db.Event,
          as: "events",
          include: [
            { model: db.Match, as: "match" },
            { model: db.Player, as: "player" },
          ],
        });
      }
    }

    const team = await db.Team.findByPk(req.params.id, {
      include: includeOptions,
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Ajouter les statistiques
    const stats = await TeamService.getTeamStats(team.id);

    res.json({
      ...team.toJSON(),
      stats,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update team (Admin ou Manager de l'équipe)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Vérifier les permissions
    const canEdit =
      req.user.role === "Admin" ||
      (req.user.role === "Manager" && req.user.teamId == req.params.id);

    if (!canEdit) {
      return res.status(403).json({
        error: "Access denied. You can only manage your own team.",
      });
    }

    const {
      name,
      shortName,
      logoUrl,
      primaryColor,
      secondaryColor,
      ...otherData
    } = req.body;

    // Validation
    const validationErrors = validateTeamData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Vérifier l'unicité (exclure l'équipe actuelle)
    if (name || shortName) {
      const whereClause = {
        id: { [Op.ne]: req.params.id },
      };

      if (name) whereClause.name = name.trim();
      if (shortName) whereClause.shortName = shortName.trim().toUpperCase();

      const existingTeam = await db.Team.findOne({ where: whereClause });

      if (existingTeam) {
        const conflictField =
          existingTeam.name === name?.trim() ? "name" : "shortName";
        return res.status(409).json({
          error: `Team ${conflictField} already exists`,
          field: conflictField,
        });
      }
    }

    // Mise à jour
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (shortName) updateData.shortName = shortName.trim().toUpperCase();
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl?.trim() || null;
    if (primaryColor !== undefined)
      updateData.primaryColor = primaryColor?.trim() || null;
    if (secondaryColor !== undefined)
      updateData.secondaryColor = secondaryColor?.trim() || null;

    // Autres champs pour les managers
    if (req.user.role === "Manager") {
      const allowedFields = [
        "stadium",
        "city",
        "description",
        "website",
        "contactEmail",
        "contactPhone",
      ];
      allowedFields.forEach((field) => {
        if (otherData[field] !== undefined) {
          updateData[field] = otherData[field];
        }
      });
    } else if (req.user.role === "Admin") {
      // Admin peut modifier tous les champs
      Object.assign(updateData, otherData);
    }

    const updatedTeam = await team.update(updateData);

    req.io.emit("team_updated", updatedTeam);

    res.json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE team avec vérifications étendues (Admin seulement)
router.delete("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id, {
      include: [
        { model: db.User, as: "staff" },
        { model: db.Player, as: "players" },
        { model: db.Match, as: "homeMatches" },
        { model: db.Match, as: "awayMatches" },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Vérifications avant suppression
    const activeMatches = [...team.homeMatches, ...team.awayMatches].filter(
      (match) => match.status === "live" || match.status === "scheduled"
    );

    if (activeMatches.length > 0) {
      return res.status(400).json({
        error: "Cannot delete team with active or scheduled matches",
        details: `${activeMatches.length} match(es) must be completed or cancelled first`,
      });
    }

    // Supprimer en cascade
    const transaction = await db.sequelize.transaction();

    try {
      // Supprimer les comptes associés
      if (team.staff && team.staff.length > 0) {
        await db.User.destroy({
          where: { teamId: team.id },
          transaction,
        });
      }

      // Supprimer les joueurs
      if (team.players && team.players.length > 0) {
        await db.Player.destroy({
          where: { teamId: team.id },
          transaction,
        });
      }

      // Supprimer l'équipe
      await team.destroy({ transaction });

      await transaction.commit();

      req.io.emit("team_deleted", { id: team.id });

      res.json({
        message: "Team deleted successfully",
        deletedAccounts: team.staff?.length || 0,
        deletedPlayers: team.players?.length || 0,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST reset password pour les comptes d'équipe (Admin seulement)
router.post(
  "/:id/reset-password",
  authenticate,
  authorize(["Admin"]),
  async (req, res) => {
    try {
      const { accountType } = req.body; // 'manager' ou 'reporter'

      if (!["manager", "reporter"].includes(accountType)) {
        return res.status(400).json({
          error: "Invalid account type. Must be 'manager' or 'reporter'",
        });
      }

      const team = await db.Team.findByPk(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Trouver le compte à réinitialiser
      const user = await db.User.findOne({
        where: {
          teamId: team.id,
          role: accountType === "manager" ? "Manager" : "Reporter",
        },
      });

      if (!user) {
        return res.status(404).json({
          error: `${accountType} account not found for this team`,
        });
      }

      // Réinitialiser le mot de passe
      const credentials = await TeamService.resetTeamAccountPassword(user.id);

      res.json({
        message: `${accountType} password reset successfully`,
        credentials: {
          username: credentials.username,
          email: credentials.email,
          temporaryPassword: credentials.temporaryPassword,
        },
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET team statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const team = await db.Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const stats = await TeamService.getTeamStats(req.params.id);

    // Statistiques de matchs
    const matchStats = await db.Match.findAll({
      where: {
        [Op.or]: [{ homeTeamId: req.params.id }, { awayTeamId: req.params.id }],
      },
      attributes: ["status", "homeScore", "awayScore", "homeTeamId"],
    });

    const wins = matchStats.filter((match) => {
      if (match.status !== "finished") return false;
      const isHome = match.homeTeamId == req.params.id;
      return isHome
        ? match.homeScore > match.awayScore
        : match.awayScore > match.homeScore;
    }).length;

    const draws = matchStats.filter((match) => {
      return match.status === "finished" && match.homeScore === match.awayScore;
    }).length;

    const losses = matchStats.filter((match) => {
      if (match.status !== "finished") return false;
      const isHome = match.homeTeamId == req.params.id;
      return isHome
        ? match.homeScore < match.awayScore
        : match.awayScore < match.homeScore;
    }).length;

    res.json({
      ...stats,
      matches: {
        total: matchStats.length,
        wins,
        draws,
        losses,
        winRate:
          matchStats.length > 0
            ? ((wins / matchStats.length) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching team stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
