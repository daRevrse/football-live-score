// routes/protectedRoutes.js
const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Admin seulement
router.get("/admin/dashboard", authenticate, authorize("Admin"), (req, res) => {
  res.json({ message: "Bienvenue Admin !" });
});

// Reporter seulement
router.post(
  "/reporter/match",
  authenticate,
  authorize("Reporter"),
  (req, res) => {
    res.json({ message: "Match ajouté par le reporter." });
  }
);

// User seulement
router.get("/user/profile", authenticate, authorize("User"), (req, res) => {
  res.json({ message: `Profil utilisateur de ${req.user.username}` });
});

// Admin & Reporter
router.get(
  "/management",
  authenticate,
  authorize(["Admin", "Reporter"]),
  (req, res) => {
    res.json({ message: "Accès réservé à Admin & Reporter" });
  }
);

module.exports = router;
