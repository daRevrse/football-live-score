require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./models");
const teamRoutes = require("./routes/teams");
const matchRoutes = require("./routes/matches");
const MatchTimerService = require("./services/MatchTimerService");
const path = require("path");
const uploadRoutes = require("./routes/upload");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP + Socket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Inject io into req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Servir les fichiers statiques (logos uploadés)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Initialise le service de timer avec Socket.IO
const timerService = new MatchTimerService(io);
app.set("timerService", timerService);

// Routes
app.use("/teams", teamRoutes);
app.use("/matches", matchRoutes);
app.use("/upload", uploadRoutes);
app.use("/auth", authRoutes);
app.use("/", protectedRoutes);
app.use("/admin", adminRoutes);

// Socket events
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinMatch", (matchId) => {
    socket.join(`match:${matchId}`);
    console.log(`${socket.id} joined match:${matchId}`);
  });

  socket.on("leaveMatch", (matchId) => {
    socket.leave(`match:${matchId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
db.sequelize
  .sync({
    force: true,
  })
  .then(() => {
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("DB sync error", err);
  });
