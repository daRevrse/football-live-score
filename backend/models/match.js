// backend/models/match.js
module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define(
    "Match",
    {
      // Équipes
      homeTeamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
      },
      awayTeamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
      },

      // Scores
      homeScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      awayScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },

      // Statut du match
      status: {
        type: DataTypes.ENUM(
          "scheduled",
          "live",
          "paused",
          "finished",
          "cancelled"
        ),
        defaultValue: "scheduled",
        allowNull: false,
      },

      // Dates et heures
      startAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      kickoffTime: {
        type: DataTypes.DATE,
        allowNull: true, // Heure réelle du coup d'envoi
      },
      firstHalfStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      secondHalfStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endAt: {
        type: DataTypes.DATE,
        allowNull: true, // Heure de fin réelle
      },

      // Gestion des pauses
      pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalPausedTime: {
        type: DataTypes.INTEGER, // en secondes
        defaultValue: 0,
      },

      // Temps de jeu
      currentMinute: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      currentSecond: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0, max: 59 },
      },

      // Temps additionnel
      additionalTimeFirstHalf: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      additionalTimeSecondHalf: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },

      // Reporter assigné (nouveau)
      reporterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },

      // Informations du match
      venue: {
        type: DataTypes.STRING,
        allowNull: true, // Stade/lieu
      },
      weather: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      temperature: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      attendance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0 },
      },

      // Métadonnées
      competition: {
        type: DataTypes.STRING,
        allowNull: true, // Championnat, Coupe, etc.
      },
      season: {
        type: DataTypes.STRING,
        allowNull: true, // 2024-2025
      },
      matchday: {
        type: DataTypes.INTEGER,
        allowNull: true, // Journée
      },

      // Notes
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "matches",
      indexes: [
        { fields: ["homeTeamId"] },
        { fields: ["awayTeamId"] },
        { fields: ["status"] },
        { fields: ["startAt"] },
        { fields: ["reporterId"] },
        { fields: ["competition", "season"] },
      ],
      validate: {
        // Validation : équipes différentes
        differentTeams() {
          if (this.homeTeamId === this.awayTeamId) {
            throw new Error("Home team and away team must be different");
          }
        },
      },
    }
  );

  Match.associate = (models) => {
    // Relations avec Team
    Match.belongsTo(models.Team, {
      as: "homeTeam",
      foreignKey: "homeTeamId",
    });
    Match.belongsTo(models.Team, {
      as: "awayTeam",
      foreignKey: "awayTeamId",
    });

    // Relations avec Event
    Match.hasMany(models.Event, {
      as: "events",
      foreignKey: "matchId",
      onDelete: "CASCADE",
    });

    // Relation avec User (Reporter)
    Match.belongsTo(models.User, {
      as: "reporter",
      foreignKey: "reporterId",
      constraints: false,
    });
  };

  // Méthodes d'instance
  Match.prototype.isLive = function () {
    return this.status === "live";
  };

  Match.prototype.isPaused = function () {
    return this.status === "paused";
  };

  Match.prototype.isFinished = function () {
    return this.status === "finished";
  };

  Match.prototype.getResult = function () {
    if (!this.isFinished()) return null;

    if (this.homeScore > this.awayScore) return "home_win";
    if (this.awayScore > this.homeScore) return "away_win";
    return "draw";
  };

  Match.prototype.getCurrentTime = function () {
    let displayMinute = this.currentMinute;

    // Ajouter le temps additionnel si nécessaire
    if (
      this.currentMinute >= 45 &&
      this.currentMinute < 90 &&
      this.additionalTimeFirstHalf > 0
    ) {
      displayMinute = `45+${Math.min(
        this.currentMinute - 45,
        this.additionalTimeFirstHalf
      )}`;
    } else if (this.currentMinute >= 90 && this.additionalTimeSecondHalf > 0) {
      displayMinute = `90+${Math.min(
        this.currentMinute - 90,
        this.additionalTimeSecondHalf
      )}`;
    }

    return displayMinute;
  };

  Match.prototype.getDuration = function () {
    if (!this.kickoffTime) return null;

    const endTime = this.endAt || new Date();
    const duration = Math.floor((endTime - this.kickoffTime) / 1000); // en secondes

    return duration - (this.totalPausedTime || 0);
  };

  Match.prototype.canBeReportedBy = function (user) {
    if (!user) return false;

    // Admin peut tout reporter
    if (user.role === "Admin") return true;

    // Reporter assigné spécifiquement à ce match
    if (this.reporterId && this.reporterId === user.id) return true;

    // Reporter de l'une des équipes participantes
    if (user.role === "Reporter" && user.teamId) {
      return user.teamId === this.homeTeamId || user.teamId === this.awayTeamId;
    }

    return false;
  };

  Match.prototype.autoAssignReporter = async function () {
    if (this.reporterId) return this.reporterId; // Déjà assigné

    // Chercher un reporter des équipes participantes
    const Reporter = this.sequelize.models.User;

    // Priorité au reporter de l'équipe à domicile
    let reporter = await Reporter.findOne({
      where: {
        role: "Reporter",
        teamId: this.homeTeamId,
        status: "active",
      },
    });

    // Sinon, reporter de l'équipe extérieure
    if (!reporter) {
      reporter = await Reporter.findOne({
        where: {
          role: "Reporter",
          teamId: this.awayTeamId,
          status: "active",
        },
      });
    }

    if (reporter) {
      await this.update({ reporterId: reporter.id });
      return reporter.id;
    }

    return null;
  };

  return Match;
};
