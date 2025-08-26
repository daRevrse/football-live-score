// backend/models/player.js
module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define(
    "Player",
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50],
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50],
        },
      },
      jerseyNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 99,
        },
      },
      position: {
        type: DataTypes.ENUM(
          "Gardien",
          "Défenseur central",
          "Latéral droit",
          "Latéral gauche",
          "Milieu défensif",
          "Milieu central",
          "Milieu offensif",
          "Ailier droit",
          "Ailier gauche",
          "Attaquant",
          "Avant-centre"
        ),
        allowNull: false,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      height: {
        type: DataTypes.INTEGER, // en cm
        allowNull: true,
        validate: {
          min: 120,
          max: 250,
        },
      },
      weight: {
        type: DataTypes.INTEGER, // en kg
        allowNull: true,
        validate: {
          min: 40,
          max: 150,
        },
      },
      photoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Informations contrat
      contractStart: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      contractEnd: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Statut du joueur
      status: {
        type: DataTypes.ENUM("active", "injured", "suspended", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
      // ID de l'équipe
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
      },
      // Informations supplémentaires
      biography: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      previousClubs: {
        type: DataTypes.TEXT, // JSON string
        allowNull: true,
      },
    },
    {
      tableName: "players",
      indexes: [
        { fields: ["teamId"] },
        { fields: ["position"] },
        { fields: ["status"] },
        // Index unique pour le numéro de maillot par équipe
        {
          fields: ["teamId", "jerseyNumber"],
          unique: true,
          name: "unique_jersey_per_team",
        },
      ],
    }
  );

  Player.associate = (models) => {
    // Appartient à une équipe
    Player.belongsTo(models.Team, {
      as: "team",
      foreignKey: "teamId",
    });

    // Relation avec les événements (buteur, cartonné, etc.)
    Player.hasMany(models.Event, {
      as: "events",
      foreignKey: "playerId",
    });
  };

  // Méthodes d'instance
  Player.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  Player.prototype.getAge = function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  Player.prototype.isAvailable = function () {
    return this.status === "active";
  };

  return Player;
};
