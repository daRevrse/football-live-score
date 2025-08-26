// backend/models/event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      // Relations principales
      matchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "matches",
          key: "id",
        },
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
      },
      playerId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Certains événements peuvent ne pas être liés à un joueur
        references: {
          model: "players",
          key: "id",
        },
      },

      // Type d'événement
      type: {
        type: DataTypes.ENUM(
          "goal",
          "own_goal",
          "penalty_goal",
          "assist",
          "yellow_card",
          "red_card",
          "substitution_in",
          "substitution_out",
          "injury",
          "offside",
          "foul",
          "corner",
          "free_kick",
          "penalty_missed",
          "save",
          "kick_off",
          "half_time",
          "full_time",
          "var_check",
          "var_decision"
        ),
        allowNull: false,
      },

      // Timing
      minute: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 120 },
      },
      second: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0, max: 59 },
      },

      // Détails de l'événement
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Pour les substitutions
      playerInId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Joueur qui entre
        references: {
          model: "players",
          key: "id",
        },
      },
      playerOutId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Joueur qui sort
        references: {
          model: "players",
          key: "id",
        },
      },

      // Pour les cartons
      cardReason: {
        type: DataTypes.STRING,
        allowNull: true, // Raison du carton
      },

      // Position sur le terrain (optionnel)
      positionX: {
        type: DataTypes.FLOAT,
        allowNull: true, // Position X (0-100)
        validate: { min: 0, max: 100 },
      },
      positionY: {
        type: DataTypes.FLOAT,
        allowNull: true, // Position Y (0-100)
        validate: { min: 0, max: 100 },
      },

      // Métadonnées
      videoUrl: {
        type: DataTypes.STRING,
        allowNull: true, // Lien vers replay/highlight
      },

      // Validation VAR
      varChecked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      varDecision: {
        type: DataTypes.ENUM("confirmed", "overturned", "pending"),
        allowNull: true,
      },

      // Statut de l'événement
      status: {
        type: DataTypes.ENUM("active", "cancelled", "pending"),
        defaultValue: "active",
        allowNull: false,
      },

      // Créateur de l'événement
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "events",
      indexes: [
        { fields: ["matchId"] },
        { fields: ["teamId"] },
        { fields: ["playerId"] },
        { fields: ["type"] },
        { fields: ["minute"] },
        { fields: ["status"] },
      ],
      validate: {
        // Validation pour les substitutions
        substitutionPlayers() {
          if (this.type === "substitution_in" && !this.playerInId) {
            throw new Error("playerInId is required for substitution_in");
          }
          if (this.type === "substitution_out" && !this.playerOutId) {
            throw new Error("playerOutId is required for substitution_out");
          }
        },

        // Validation pour les positions
        validPosition() {
          if (
            this.positionX !== null &&
            (this.positionX < 0 || this.positionX > 100)
          ) {
            throw new Error("positionX must be between 0 and 100");
          }
          if (
            this.positionY !== null &&
            (this.positionY < 0 || this.positionY > 100)
          ) {
            throw new Error("positionY must be between 0 and 100");
          }
        },
      },
    }
  );

  Event.associate = (models) => {
    // Relations principales
    Event.belongsTo(models.Match, {
      as: "match",
      foreignKey: "matchId",
    });
    Event.belongsTo(models.Team, {
      as: "team",
      foreignKey: "teamId",
    });
    Event.belongsTo(models.Player, {
      as: "player",
      foreignKey: "playerId",
    });

    // Relations pour les substitutions
    Event.belongsTo(models.Player, {
      as: "playerIn",
      foreignKey: "playerInId",
    });
    Event.belongsTo(models.Player, {
      as: "playerOut",
      foreignKey: "playerOutId",
    });

    // Créateur de l'événement
    Event.belongsTo(models.User, {
      as: "creator",
      foreignKey: "createdBy",
    });
  };

  // Méthodes d'instance
  Event.prototype.getDisplayTime = function () {
    return this.second > 0
      ? `${this.minute}:${this.second.toString().padStart(2, "0")}`
      : `${this.minute}'`;
  };

  Event.prototype.isGoal = function () {
    return ["goal", "own_goal", "penalty_goal"].includes(this.type);
  };

  Event.prototype.isCard = function () {
    return ["yellow_card", "red_card"].includes(this.type);
  };

  Event.prototype.isSubstitution = function () {
    return ["substitution_in", "substitution_out"].includes(this.type);
  };

  Event.prototype.getIcon = function () {
    const icons = {
      goal: "⚽",
      own_goal: "⚽",
      penalty_goal: "⚽",
      assist: "🅰️",
      yellow_card: "🟨",
      red_card: "🟥",
      substitution_in: "🔄",
      substitution_out: "🔄",
      injury: "🤕",
      offside: "🚩",
      foul: "❌",
      corner: "📐",
      free_kick: "🆓",
      penalty_missed: "❌",
      save: "🧤",
      kick_off: "⚽",
      half_time: "⏸️",
      full_time: "⏹️",
      var_check: "📹",
      var_decision: "✅",
    };

    return icons[this.type] || "📍";
  };

  Event.prototype.getDescription = function () {
    if (this.description) return this.description;

    // Génération automatique de description
    const descriptions = {
      goal: "But",
      own_goal: "But contre son camp",
      penalty_goal: "But sur penalty",
      assist: "Passe décisive",
      yellow_card: `Carton jaune${
        this.cardReason ? ` - ${this.cardReason}` : ""
      }`,
      red_card: `Carton rouge${this.cardReason ? ` - ${this.cardReason}` : ""}`,
      substitution_in: "Entrée en jeu",
      substitution_out: "Sortie du terrain",
      injury: "Blessure",
      offside: "Hors-jeu",
      foul: "Faute",
      corner: "Corner",
      free_kick: "Coup franc",
      penalty_missed: "Penalty raté",
      save: "Arrêt",
      kick_off: "Coup d'envoi",
      half_time: "Mi-temps",
      full_time: "Fin du match",
      var_check: "Vérification VAR",
      var_decision: "Décision VAR",
    };

    return descriptions[this.type] || "Événement";
  };

  // Méthodes statiques
  Event.getGoalEvents = function (matchId) {
    return this.findAll({
      where: {
        matchId,
        type: ["goal", "own_goal", "penalty_goal"],
        status: "active",
      },
      include: [
        { model: this.sequelize.models.Player, as: "player" },
        { model: this.sequelize.models.Team, as: "team" },
      ],
      order: [
        ["minute", "ASC"],
        ["second", "ASC"],
      ],
    });
  };

  Event.getCardEvents = function (matchId) {
    return this.findAll({
      where: {
        matchId,
        type: ["yellow_card", "red_card"],
        status: "active",
      },
      include: [
        { model: this.sequelize.models.Player, as: "player" },
        { model: this.sequelize.models.Team, as: "team" },
      ],
      order: [
        ["minute", "ASC"],
        ["second", "ASC"],
      ],
    });
  };

  return Event;
};
