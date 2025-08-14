// backend/models/team.js
module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define(
    "Team",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Empêche doublons
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      shortName: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [1, 10],
        },
      },
      logoUrl: {
        type: DataTypes.STRING,
        validate: { isUrl: true },
      },
      primaryColor: {
        type: DataTypes.STRING,
        validate: { is: /^#([0-9A-F]{3}){1,2}$/i }, // Hex color
      },
      secondaryColor: {
        type: DataTypes.STRING,
        validate: { is: /^#([0-9A-F]{3}){1,2}$/i },
      },
    },
    {
      tableName: "teams",
      indexes: [{ fields: ["name"] }, { fields: ["shortName"] }],
    }
  );

  Team.associate = (models) => {
    Team.hasMany(models.Match, { as: "homeMatches", foreignKey: "homeTeamId" });
    Team.hasMany(models.Match, { as: "awayMatches", foreignKey: "awayTeamId" });
    Team.hasMany(models.Event, { as: "events", foreignKey: "teamId" });
  };

  return Team;
};
