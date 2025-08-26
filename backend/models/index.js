// backend/models/index.js
const { Sequelize } = require("sequelize");
const config = require("../config/config").development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import des modèles
db.Team = require("./team")(sequelize, Sequelize);
db.Match = require("./match")(sequelize, Sequelize);
db.Event = require("./event")(sequelize, Sequelize);
db.User = require("./user")(sequelize, Sequelize);
db.Player = require("./player")(sequelize, Sequelize);

console.log("🔗 Configuration des relations de base de données...");

// Configuration des relations via les méthodes associate de chaque modèle
// Cela évite la duplication d'alias
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

console.log("✅ Relations configurées avec succès");

// Test de connexion à la base de données
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données établie avec succès");
  } catch (error) {
    console.error("❌ Impossible de se connecter à la base de données:", error);
  }
};

testConnection();

module.exports = db;
