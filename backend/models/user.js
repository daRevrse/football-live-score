// backend/models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 30],
          is: /^[a-zA-Z0-9_]+$/, // Alphanumeric + underscore
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
          len: [5, 255],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [8, 255], // ✅ Changé de [60,60] à [8,255] pour plus de flexibilité
        },
      },
      role: {
        type: DataTypes.ENUM("Admin", "Reporter", "User"),
        allowNull: false,
        defaultValue: "User",
        validate: {
          isIn: [["Admin", "Reporter", "User"]],
        },
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "users",
      indexes: [
        { fields: ["username"] },
        { fields: ["email"] },
        { fields: ["role"] },
      ],
      defaultScope: {
        attributes: { exclude: ["password"] }, // Exclut le password par défaut
      },
      scopes: {
        withPassword: {
          attributes: {}, // Inclut tous les attributs y compris password
        },
      },
    }
  );

  User.associate = (models) => {
    // Ajoutez ici les associations si nécessaire
    // Par exemple, si un utilisateur peut créer des matchs :
    // User.hasMany(models.Match, { as: "createdMatches", foreignKey: "createdById" });
  };

  // Méthodes d'instance (optionnel)
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password; // Garantit que le password n'est jamais envoyé au client
    return values;
  };

  return User;
};
