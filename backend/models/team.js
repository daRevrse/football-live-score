// backend/models/team.js
module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define(
    "Team",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      // Slug pour les emails automatiques - généré automatiquement
      slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false, // Requis maintenant
        validate: {
          len: [2, 50],
          is: /^[a-z0-9-]+$/i, // Seulement lettres, chiffres et tirets
        },
      },
      logoUrl: {
        type: DataTypes.STRING,
        validate: {},
      },
      primaryColor: {
        type: DataTypes.STRING,
        validate: { is: /^#([0-9A-F]{3}){1,2}$/i },
      },
      secondaryColor: {
        type: DataTypes.STRING,
        validate: { is: /^#([0-9A-F]{3}){1,2}$/i },
      },
      // Nouvelles informations équipe
      foundedYear: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1800,
          max: new Date().getFullYear(),
        },
      },
      stadium: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING,
        validate: {
          isUrl: true,
        },
      },
      contactEmail: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "suspended"),
        defaultValue: "active",
        allowNull: false,
      },
    },
    {
      tableName: "teams",
      indexes: [
        { fields: ["name"] },
        { fields: ["shortName"] },
        { fields: ["slug"] },
        { fields: ["status"] },
      ],
      hooks: {
        beforeValidate: (team, options) => {
          // Générer le slug automatiquement si pas fourni
          if (!team.slug && team.name) {
            team.slug = generateSlug(team.name);
          }
        },
        beforeUpdate: (team, options) => {
          // Mettre à jour le slug si le nom change et pas de slug personnalisé
          if (team.changed("name") && team.name && !team.slug) {
            team.slug = generateSlug(team.name);
          }
        },
      },
    }
  );

  // Fonction utilitaire pour générer le slug
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[àáäâ]/g, "a")
      .replace(/[èéëê]/g, "e")
      .replace(/[ìíïî]/g, "i")
      .replace(/[òóöô]/g, "o")
      .replace(/[ùúüû]/g, "u")
      .replace(/[ç]/g, "c")
      .replace(/[ñ]/g, "n")
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer espaces par tirets
      .replace(/-+/g, "-") // Supprimer tirets multiples
      .replace(/^-|-$/g, "") // Supprimer tirets début/fin
      .substring(0, 50); // Limiter à 50 caractères
  };

  Team.associate = (models) => {
    // Relations existantes
    Team.hasMany(models.Match, {
      as: "homeMatches",
      foreignKey: "homeTeamId",
    });
    Team.hasMany(models.Match, {
      as: "awayMatches",
      foreignKey: "awayTeamId",
    });
    Team.hasMany(models.Event, {
      as: "events",
      foreignKey: "teamId",
    });

    // Nouvelles relations avec User (conditionnel pour éviter les erreurs)
    if (models.User) {
      Team.hasOne(models.User, {
        as: "manager",
        foreignKey: "teamId",
        scope: { role: "Manager" },
        constraints: false,
      });
      Team.hasOne(models.User, {
        as: "reporter",
        foreignKey: "teamId",
        scope: { role: "Reporter" },
        constraints: false,
      });
      Team.hasMany(models.User, {
        as: "staff",
        foreignKey: "teamId",
        constraints: false,
      });
    }

    // Relation avec Player (conditionnel)
    if (models.Player) {
      Team.hasMany(models.Player, {
        as: "players",
        foreignKey: "teamId",
      });
    }
  };

  // Méthodes d'instance
  Team.prototype.getManagerEmail = function () {
    return `manager@${this.slug}.app`;
  };

  Team.prototype.getReporterEmail = function () {
    return `reporter@${this.slug}.app`;
  };

  // Méthode statique pour générer un slug unique
  Team.generateUniqueSlug = async function (baseName, excludeId = null) {
    let baseSlug = generateSlug(baseName);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const whereClause = { slug };
      if (excludeId) {
        whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
      }

      const existingTeam = await Team.findOne({ where: whereClause });

      if (!existingTeam) {
        break; // Slug disponible
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  };

  return Team;
};
