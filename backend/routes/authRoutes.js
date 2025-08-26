// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const { Op } = require("sequelize");

// Validation des données d'inscription
const validateRegisterData = (data) => {
  const errors = [];

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

  if (!data.email || !data.email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.password) {
    errors.push("Password is required");
  } else if (data.password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  return errors;
};

// Validation des données de connexion
const validateLoginData = (data) => {
  const errors = [];

  if (!data.email || !data.email.trim()) {
    errors.push("Email is required");
  }

  if (!data.password) {
    errors.push("Password is required");
  }

  return errors;
};

// POST /register - User registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role = "User" } = req.body;

    // Validation
    const validationErrors = validateRegisterData(req.body);
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

    // ATTENTION: Ne pas hasher ici car le modèle le fait déjà dans beforeCreate
    // Créer l'utilisateur
    const user = await db.User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: password, // Le modèle se charge du hashage
      role: ["Admin", "Reporter", "User", "Manager"].includes(role)
        ? role
        : "User",
    });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Réponse sans mot de passe
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);

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

// POST /login - User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    const validationErrors = validateLoginData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Trouver l'utilisateur AVEC le mot de passe
    const user = await db.User.findOne({
      where: { email: email.trim().toLowerCase() },
      attributes: {
        include: ["password"], // Inclure explicitement le password
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        details: ["Invalid email or password"],
      });
    }

    // Vérifier le mot de passe avec la méthode du modèle
    const validPassword = await user.comparePassword(password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Authentication failed",
        details: ["Invalid email or password"],
      });
    }

    // Mettre à jour la dernière connexion
    if (user.lastLogin !== undefined) {
      await user.update({ lastLogin: new Date() });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        teamId: user.teamId || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /me - Get current user profile (protégé)
router.get("/me", async (req, res) => {
  try {
    // Vérifier le token
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(decoded.id, {
      include: [
        {
          model: db.Team,
          as: "managedTeam",
          attributes: ["id", "name", "slug"],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      teamId: user.teamId || null,
      managedTeam: user.managedTeam || null,
      status: user.status || "active",
      temporaryPassword: user.temporaryPassword || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Profile error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
