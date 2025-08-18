const { Sequelize } = require("sequelize");
const config = require("../config/config").development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
  }
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import modèles
db.Team = require("./team")(sequelize, Sequelize);
db.Match = require("./match")(sequelize, Sequelize);
db.Event = require("./event")(sequelize, Sequelize);
db.User = require("./user")(sequelize, Sequelize);

// Relations
// db.Match.belongsTo(db.Team, { as: "homeTeam", foreignKey: "homeTeamId" });
// db.Match.belongsTo(db.Team, { as: "awayTeam", foreignKey: "awayTeamId" });
// db.Event.belongsTo(db.Match, { foreignKey: "match_id" });
// db.Event.belongsTo(db.Team, { foreignKey: "teamId" });

Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
