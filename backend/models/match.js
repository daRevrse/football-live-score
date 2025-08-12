// backend/models/match.js
module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define(
    "Match",
    {
      homeTeamId: { type: DataTypes.INTEGER, allowNull: false },
      awayTeamId: { type: DataTypes.INTEGER, allowNull: false },
      homeScore: { type: DataTypes.INTEGER, defaultValue: 0 },
      awayScore: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: { type: DataTypes.STRING, defaultValue: "scheduled" },
      startAt: { type: DataTypes.DATE },
    },
    {
      tableName: "matches",
    }
  );

  Match.associate = (models) => {
    Match.belongsTo(models.Team, { as: "homeTeam", foreignKey: "homeTeamId" });
    Match.belongsTo(models.Team, { as: "awayTeam", foreignKey: "awayTeamId" });
    Match.hasMany(models.Event, { as: "events", foreignKey: "matchId" });
  };

  return Match;
};
