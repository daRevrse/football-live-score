// backend/models/event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      matchId: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      teamId: { type: DataTypes.INTEGER, allowNull: true },
      player: { type: DataTypes.STRING },
      minute: { type: DataTypes.INTEGER },
    },
    {
      tableName: "events",
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.Match, { as: "match", foreignKey: "matchId" });
    Event.belongsTo(models.Team, { as: "team", foreignKey: "teamId" });
  };

  return Event;
};
