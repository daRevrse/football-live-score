// backend/models/team.js
module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define(
    "Team",
    {
      name: { type: DataTypes.STRING, allowNull: false },
      shortName: { type: DataTypes.STRING },
    },
    {
      tableName: "teams",
    }
  );

  Team.associate = (models) => {
    Team.hasMany(models.Match, { as: "homeMatches", foreignKey: "homeTeamId" });
    Team.hasMany(models.Match, { as: "awayMatches", foreignKey: "awayTeamId" });
    Team.hasMany(models.Event, { as: "events", foreignKey: "teamId" });
  };

  return Team;
};
