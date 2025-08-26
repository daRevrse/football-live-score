// backend/models/user.js
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 255],
        },
      },
      role: {
        type: DataTypes.ENUM("Admin", "Manager", "Reporter", "User"),
        defaultValue: "User",
        allowNull: false,
      },
      // Nouveau : ID de l'équipe assignée (pour Manager/Reporter)
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "teams",
          key: "id",
        },
      },
      // Nouveau : Statut du compte
      status: {
        type: DataTypes.ENUM("active", "inactive", "pending"),
        defaultValue: "active",
        allowNull: false,
      },
      // Nouveau : Mot de passe temporaire
      temporaryPassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Nouveau : Token de réinitialisation
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Nouveau : Expiration du token
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Données personnelles
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      indexes: [
        { fields: ["email"] },
        { fields: ["username"] },
        { fields: ["teamId"] },
        { fields: ["role"] },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  User.associate = (models) => {
    // Relation avec Team (Manager/Reporter appartiennent à une équipe)
    User.belongsTo(models.Team, {
      as: "managedTeam",
      foreignKey: "teamId",
      constraints: false,
    });

    // Relation pour les matchs assignés aux reporters
    User.hasMany(models.Match, {
      as: "assignedMatches",
      foreignKey: "reporterId",
    });
  };

  // Méthodes d'instance
  User.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.isManager = function () {
    return this.role === "Manager";
  };

  User.prototype.isReporter = function () {
    return this.role === "Reporter";
  };

  User.prototype.canManageTeam = function (teamId) {
    return (
      this.role === "Admin" ||
      (this.role === "Manager" && this.teamId === teamId)
    );
  };

  User.prototype.canReportForTeam = function (teamId) {
    return (
      this.role === "Admin" ||
      (this.role === "Reporter" && this.teamId === teamId)
    );
  };

  return User;
};
