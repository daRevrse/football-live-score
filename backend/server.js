// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Import des modules
const db = require("./models");
const MatchTimerService = require("./services/MatchTimerService");

// Import des routes
const teamRoutes = require("./routes/teams");
const matchRoutes = require("./routes/matches");
const playerRoutes = require("./routes/players");
const uploadRoutes = require("./routes/upload");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Configuration CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL?.split(",") || ["http://localhost:3000"]
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:19006",
        ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create HTTP + Socket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Inject io into req for all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware de logging en développement
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Servir les fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Routes API
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/admin", adminRoutes);

// Routes de compatibilité (sans /api pour l'existant)
app.use("/teams", teamRoutes);
app.use("/matches", matchRoutes);
app.use("/players", playerRoutes);
app.use("/upload", uploadRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

// Initialise le service de timer avec Socket.IO
let timerService;
const initializeTimerService = () => {
  try {
    timerService = new MatchTimerService(io);
    app.set("timerService", timerService);
    console.log("✅ Service de timer initialisé");
  } catch (error) {
    console.error("❌ Erreur initialisation service timer:", error);
  }
};

// Socket events avec gestion d'erreurs
io.on("connection", (socket) => {
  console.log(`🔌 Socket connecté: ${socket.id}`);

  // Rejoindre une room de match
  socket.on("joinMatch", (matchId) => {
    try {
      if (matchId) {
        socket.join(`match:${matchId}`);
        console.log(`📺 ${socket.id} a rejoint match:${matchId}`);
        socket.emit("joinedMatch", { matchId });
      }
    } catch (error) {
      console.error("Erreur joinMatch:", error);
      socket.emit("error", { message: "Erreur lors de la connexion au match" });
    }
  });

  // Quitter une room de match
  socket.on("leaveMatch", (matchId) => {
    try {
      if (matchId) {
        socket.leave(`match:${matchId}`);
        console.log(`📺 ${socket.id} a quitté match:${matchId}`);
      }
    } catch (error) {
      console.error("Erreur leaveMatch:", error);
    }
  });

  // Rejoindre une room d'équipe (pour les managers/reporters)
  socket.on("joinTeam", (teamId) => {
    try {
      if (teamId) {
        socket.join(`team:${teamId}`);
        console.log(`👥 ${socket.id} a rejoint team:${teamId}`);
      }
    } catch (error) {
      console.error("Erreur joinTeam:", error);
      socket.emit("error", {
        message: "Erreur lors de la connexion à l'équipe",
      });
    }
  });

  socket.on("leaveTeam", (teamId) => {
    try {
      if (teamId) {
        socket.leave(`team:${teamId}`);
        console.log(`👥 ${socket.id} a quitté team:${teamId}`);
      }
    } catch (error) {
      console.error("Erreur leaveTeam:", error);
    }
  });

  // Gestion de la déconnexion
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket déconnecté: ${socket.id} - Raison: ${reason}`);
  });

  // Gestion des erreurs socket
  socket.on("error", (error) => {
    console.error(`❌ Erreur socket ${socket.id}:`, error);
  });
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error("❌ Erreur non gérée:", error);

  // Ne pas exposer les détails d'erreur en production
  const message =
    process.env.NODE_ENV === "production"
      ? "Une erreur interne est survenue"
      : error.message;

  res.status(error.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

app.all(/^\/api\/.*/, (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

// Configuration du serveur
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    console.log("🚀 Démarrage du serveur...");

    // Test de connexion à la base de données
    await db.sequelize.authenticate();
    console.log("✅ Connexion à la base de données établie");

    // Synchronisation de la base de données
    const syncOptions = {
      force:
        process.env.RESET_DB === "true" &&
        process.env.NODE_ENV === "development",
      alter: process.env.NODE_ENV === "development",
    };

    if (syncOptions.force) {
      console.log("⚠️  ATTENTION: Reset complet de la base de données activé!");
    }

    await db.sequelize.sync(syncOptions);
    console.log("✅ Base de données synchronisée");

    // Créer les dossiers nécessaires
    const fs = require("fs");
    const uploadsDir = path.join(__dirname, "uploads/logos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("📁 Dossier uploads créé");
    }

    // Initialiser le service de timer
    initializeTimerService();

    // Démarrer le serveur
    server.listen(PORT, HOST, () => {
      console.log(`🌟 Serveur démarré sur ${HOST}:${PORT}`);
      console.log(`🔗 Socket.IO activé`);
      console.log(`📊 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
    });

    // Gestion des erreurs serveur
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Le port ${PORT} est déjà utilisé`);
      } else {
        console.error("❌ Erreur serveur:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Erreur de démarrage:", error);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt du serveur
process.on("SIGTERM", async () => {
  console.log("\n🛑 Signal SIGTERM reçu, arrêt du serveur...");

  server.close(async () => {
    console.log("🔌 Serveur HTTP fermé");

    if (timerService) {
      timerService.stopAllTimers?.();
      console.log("⏹️  Service de timer arrêté");
    }

    await db.sequelize.close();
    console.log("🔐 Connexion base de données fermée");

    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("\n🛑 Signal SIGINT reçu, arrêt du serveur...");
  process.emit("SIGTERM");
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Démarrer le serveur
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
