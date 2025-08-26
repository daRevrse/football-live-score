// middleware/matchAuth.js
const { Match } = require("../models");

const authorizeMatchAccess = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Les admins ont accès à tous les matchs
    if (userRole === "Admin") return next();

    const match = await Match.findByPk(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match non trouvé" });
    }

    // Vérifier si l'utilisateur est le reporter assigné à ce match
    if (match.reporterId !== userId) {
      return res.status(403).json({
        error: "Accès interdit. Vous n'êtes pas assigné à ce match.",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur d'autorisation match:", error);
    res
      .status(500)
      .json({
        error: "Erreur serveur lors de la vérification des permissions",
      });
  }
};

module.exports = { authorizeMatchAccess };
