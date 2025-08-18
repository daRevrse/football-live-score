// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const db = require("../models");
const { authenticate, authorize } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// Validation des données utilisateur
const validateUserData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.username) {
    if (!data.username || !data.username.trim()) {
      errors.push("Username is required");
    } else if (
      data.username.trim().length < 3 ||
      data.username.trim().length > 30
    ) {
      errors.push("Username must be between 3 and 30 characters");
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push("Username can only contain letters, numbers and underscores");
    }
  }

  if (!isUpdate || data.email) {
    if (!data.email || !data.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Invalid email format");
    }
  }

  if (!isUpdate && (!data.password || data.password.length < 8)) {
    errors.push("Password must be at least 8 characters");
  }

  if (data.role && !["Admin", "Reporter", "User"].includes(data.role)) {
    errors.push("Invalid role specified");
  }

  return errors;
};

// GET /admin/users - Liste tous les utilisateurs (Admin seulement)
router.get("/users", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = search
      ? {
          [Op.or]: [
            { username: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows: users } = await db.User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/users - Crée un nouvel utilisateur (Admin seulement)
router.post("/users", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { username, email, password, role = "User" } = req.body;

    // Validation
    const validationErrors = validateUserData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Vérifier l'unicité
    const existingUser = await db.User.findOne({
      where: {
        [Op.or]: [
          { username: username.trim() },
          { email: email.trim().toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      const conflictField =
        existingUser.username === username.trim() ? "username" : "email";
      return res.status(409).json({
        error: `${conflictField} already exists`,
        field: conflictField,
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await db.User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role,
    });

    // Ne pas renvoyer le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/users/:id - Récupère un utilisateur spécifique (Admin seulement)
router.get(
  "/users/:id",
  authenticate,
  authorize(["Admin"]),
  async (req, res) => {
    try {
      const user = await db.User.findByPk(req.params.id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /admin/users/:id - Met à jour un utilisateur (Admin seulement)
router.put(
  "/users/:id",
  authenticate,
  authorize(["Admin"]),
  async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      // Trouver l'utilisateur
      const user = await db.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validation
      const validationErrors = validateUserData(req.body, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors,
        });
      }

      // Vérifier l'unicité (exclure l'utilisateur actuel)
      if (username || email) {
        const whereClause = {
          id: { [Op.ne]: req.params.id },
        };

        if (username) whereClause.username = username.trim();
        if (email) whereClause.email = email.trim().toLowerCase();

        const existingUser = await db.User.findOne({
          where: whereClause,
        });

        if (existingUser) {
          const conflictField =
            existingUser.username === username?.trim() ? "username" : "email";
          return res.status(409).json({
            error: `${conflictField} already exists`,
            field: conflictField,
          });
        }
      }

      // Préparer les données de mise à jour
      const updateData = {};
      if (username) updateData.username = username.trim();
      if (email) updateData.email = email.trim().toLowerCase();
      if (password) updateData.password = await bcrypt.hash(password, 10);
      if (role) updateData.role = role;

      // Mettre à jour l'utilisateur
      const updatedUser = await user.update(updateData);

      // Ne pas renvoyer le mot de passe
      const userResponse = updatedUser.toJSON();
      delete userResponse.password;

      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((e) => e.message),
        });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /admin/users/:id - Supprime un utilisateur (Admin seulement)
router.delete(
  "/users/:id",
  authenticate,
  authorize(["Admin"]),
  async (req, res) => {
    try {
      // Empêcher l'auto-suppression
      if (req.user.id === parseInt(req.params.id)) {
        return res.status(403).json({
          error: "You cannot delete your own account",
        });
      }

      const user = await db.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await user.destroy();
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
