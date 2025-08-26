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
      kickoffTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      currentMinute: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      currentSecond: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      firstHalfStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      secondHalfStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalPausedTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // En secondes
      },
      additionalTimeFirstHalf: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      additionalTimeSecondHalf: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reporterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "matches",
    }
  );

  Match.associate = (models) => {
    Match.belongsTo(models.Team, { as: "homeTeam", foreignKey: "homeTeamId" });
    Match.belongsTo(models.Team, { as: "awayTeam", foreignKey: "awayTeamId" });
    Match.belongsTo(models.User, { as: "reporter", foreignKey: "reporterId" });
    Match.hasMany(models.Event, { as: "events", foreignKey: "matchId" });
  };

  return Match;
};
