// middleware/auth.js
const jwt = require("jsonwebtoken");
const { User } = require("../models"); // ✅ Correction importante

const authenticate = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Accès refusé. Token manquant." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    if (!req.user)
      return res.status(401).json({ message: "Utilisateur non trouvé." });
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide." });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === "string") roles = [roles];
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit." });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
