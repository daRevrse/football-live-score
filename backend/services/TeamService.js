// backend/services/TeamService.js
const crypto = require("crypto");
const { User, Team, sequelize } = require("../models");

class TeamService {
  /**
   * Créer une équipe avec les comptes Manager et Reporter automatiques
   */
  static async createTeamWithAccounts(teamData, creatorId) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Créer l'équipe
      const team = await Team.create(teamData, { transaction });

      // 2. Générer des mots de passe temporaires
      const managerPassword = this.generateTemporaryPassword();
      const reporterPassword = this.generateTemporaryPassword();

      // 3. Créer le compte Manager
      const managerEmail = team.getManagerEmail();
      const managerUsername = `${team.slug}_manager`;

      const manager = await User.create(
        {
          username: managerUsername,
          email: managerEmail,
          password: managerPassword,
          role: "Manager",
          teamId: team.id,
          temporaryPassword: true,
          status: "pending",
          firstName: "Manager",
          lastName: team.name,
        },
        { transaction }
      );

      // 4. Créer le compte Reporter
      const reporterEmail = team.getReporterEmail();
      const reporterUsername = `${team.slug}_reporter`;

      const reporter = await User.create(
        {
          username: reporterUsername,
          email: reporterEmail,
          password: reporterPassword,
          role: "Reporter",
          teamId: team.id,
          temporaryPassword: true,
          status: "pending",
          firstName: "Reporter",
          lastName: team.name,
        },
        { transaction }
      );

      // 5. Valider la transaction
      await transaction.commit();

      // 6. Préparer les informations de retour
      const credentials = {
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
        },
        manager: {
          id: manager.id,
          username: managerUsername,
          email: managerEmail,
          password: managerPassword, // À supprimer après envoi
        },
        reporter: {
          id: reporter.id,
          username: reporterUsername,
          email: reporterEmail,
          password: reporterPassword, // À supprimer après envoi
        },
      };

      // 7. Envoyer les emails avec les credentials (async, ne pas attendre)
      this.sendCredentialsEmail(credentials).catch((error) => {
        console.error("Erreur envoi email credentials:", error);
      });

      return {
        team,
        manager,
        reporter,
        credentials: {
          manager: {
            username: managerUsername,
            email: managerEmail,
            temporaryPassword: managerPassword,
          },
          reporter: {
            username: reporterUsername,
            email: reporterEmail,
            temporaryPassword: reporterPassword,
          },
        },
      };
    } catch (error) {
      // Rollback en cas d'erreur
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Générer un mot de passe temporaire sécurisé
   */
  static generateTemporaryPassword() {
    // Mot de passe de 12 caractères avec majuscules, minuscules, chiffres
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";

    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  /**
   * Valider le slug d'équipe (unicité et format)
   */
  static async validateTeamSlug(slug, excludeId = null) {
    const whereClause = { slug };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingTeam = await Team.findOne({ where: whereClause });
    return !existingTeam;
  }

  /**
   * Envoyer les emails avec les credentials
   * (À implémenter avec votre service d'email)
   */
  static async sendCredentialsEmail(credentials) {
    console.log("=== CREDENTIALS D'ÉQUIPE ===");
    console.log(`Équipe: ${credentials.team.name}`);
    console.log("");
    console.log("COMPTE MANAGER:");
    console.log(`Username: ${credentials.manager.username}`);
    console.log(`Email: ${credentials.manager.email}`);
    console.log(`Password: ${credentials.manager.password}`);
    console.log("");
    console.log("COMPTE REPORTER:");
    console.log(`Username: ${credentials.reporter.username}`);
    console.log(`Email: ${credentials.reporter.email}`);
    console.log(`Password: ${credentials.reporter.password}`);
    console.log("================================");

    // TODO: Implémenter l'envoi d'email réel
    // - Utiliser un service comme SendGrid, Mailgun, etc.
    // - Template email avec instructions
    // - Lien pour changer le mot de passe

    return true;
  }

  /**
   * Obtenir les statistiques d'une équipe
   */
  static async getTeamStats(teamId) {
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: User,
          as: "staff",
          attributes: ["id", "role", "status"],
        },
        {
          model: Player,
          as: "players",
          attributes: ["id", "status"],
        },
      ],
    });

    if (!team) return null;

    return {
      totalPlayers: team.players?.length || 0,
      activePlayers:
        team.players?.filter((p) => p.status === "active").length || 0,
      injuredPlayers:
        team.players?.filter((p) => p.status === "injured").length || 0,
      staff: team.staff?.length || 0,
    };
  }

  /**
   * Réinitialiser le mot de passe d'un compte d'équipe
   */
  static async resetTeamAccountPassword(userId) {
    const user = await User.findByPk(userId);
    if (!user || !["Manager", "Reporter"].includes(user.role)) {
      throw new Error("Utilisateur non trouvé ou non autorisé");
    }

    const newPassword = this.generateTemporaryPassword();

    await user.update({
      password: newPassword,
      temporaryPassword: true,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return {
      username: user.username,
      email: user.email,
      temporaryPassword: newPassword,
    };
  }
}

module.exports = TeamService;
