// backend/scripts/migrate-database.js
require("dotenv").config();
const db = require("../models");

const runMigration = async () => {
  console.log("🚀 Démarrage de la migration de base de données...\n");

  try {
    // Test de connexion
    await db.sequelize.authenticate();
    console.log("✅ Connexion à la base de données réussie");

    // 1. Sauvegarder les données existantes si nécessaire
    console.log("\n📦 Sauvegarde des données existantes...");

    const existingTeams = await db.Team.findAll().catch(() => []);
    const existingUsers = await db.User.findAll().catch(() => []);
    const existingMatches = await db.Match.findAll().catch(() => []);

    console.log(`- ${existingTeams.length} équipes trouvées`);
    console.log(`- ${existingUsers.length} utilisateurs trouvés`);
    console.log(`- ${existingMatches.length} matchs trouvés`);

    // 2. Synchroniser les modèles avec les nouvelles structures
    console.log("\n🔄 Synchronisation des modèles...");

    await db.sequelize.sync({
      alter: true, // Modifie les tables existantes
      logging: console.log,
    });

    console.log("✅ Modèles synchronisés");

    // 3. Migrations spécifiques
    console.log("\n⚙️  Exécution des migrations spécifiques...");

    // Migration 1: Ajouter les slugs manquants aux équipes existantes
    const teamsWithoutSlug = await db.Team.findAll({
      where: {
        slug: null,
      },
    });

    for (const team of teamsWithoutSlug) {
      const slug = team.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      await team.update({ slug });
      console.log(`  - Slug généré pour "${team.name}": ${slug}`);
    }

    // Migration 2: Créer les comptes Manager/Reporter pour les équipes existantes
    console.log(
      "\n👥 Création des comptes Manager/Reporter pour les équipes existantes..."
    );

    const TeamService = require("../services/TeamService");

    const teamsWithoutAccounts = await db.Team.findAll({
      include: [
        {
          model: db.User,
          as: "manager",
          required: false,
        },
        {
          model: db.User,
          as: "reporter",
          required: false,
        },
      ],
    });

    for (const team of teamsWithoutAccounts) {
      let accountsCreated = [];

      // Créer le manager si n'existe pas
      if (!team.manager) {
        const managerPassword = TeamService.generateTemporaryPassword();

        try {
          const manager = await db.User.create({
            username: `${team.slug}_manager`,
            email: team.getManagerEmail(),
            password: managerPassword,
            role: "Manager",
            teamId: team.id,
            temporaryPassword: true,
            status: "pending",
            firstName: "Manager",
            lastName: team.name,
          });

          accountsCreated.push(`Manager (${manager.email})`);
        } catch (error) {
          console.log(
            `    ⚠️  Erreur création Manager pour ${team.name}: ${error.message}`
          );
        }
      }

      // Créer le reporter si n'existe pas
      if (!team.reporter) {
        const reporterPassword = TeamService.generateTemporaryPassword();

        try {
          const reporter = await db.User.create({
            username: `${team.slug}_reporter`,
            email: team.getReporterEmail(),
            password: reporterPassword,
            role: "Reporter",
            teamId: team.id,
            temporaryPassword: true,
            status: "pending",
            firstName: "Reporter",
            lastName: team.name,
          });

          accountsCreated.push(`Reporter (${reporter.email})`);
        } catch (error) {
          console.log(
            `    ⚠️  Erreur création Reporter pour ${team.name}: ${error.message}`
          );
        }
      }

      if (accountsCreated.length > 0) {
        console.log(`  - Équipe "${team.name}": ${accountsCreated.join(", ")}`);
      }
    }

    // Migration 3: Auto-assigner les reporters aux matchs existants
    console.log("\n📝 Auto-assignation des reporters aux matchs...");

    const matchesWithoutReporter = await db.Match.findAll({
      where: {
        reporterId: null,
        status: ["scheduled", "live", "paused"],
      },
      include: [
        { model: db.Team, as: "homeTeam" },
        { model: db.Team, as: "awayTeam" },
      ],
    });

    for (const match of matchesWithoutReporter) {
      try {
        const reporterId = await match.autoAssignReporter();
        if (reporterId) {
          console.log(
            `  - Match ${match.homeTeam.name} vs ${match.awayTeam.name}: Reporter assigné`
          );
        }
      } catch (error) {
        console.log(
          `    ⚠️  Erreur assignation reporter pour match ${match.id}: ${error.message}`
        );
      }
    }

    // 4. Vérifications finales
    console.log("\n🔍 Vérifications finales...");

    const finalStats = {
      teams: await db.Team.count(),
      users: await db.User.count(),
      players: await db.Player.count().catch(() => 0),
      matches: await db.Match.count(),
      events: await db.Event.count(),
      managers: await db.User.count({ where: { role: "Manager" } }),
      reporters: await db.User.count({ where: { role: "Reporter" } }),
    };

    console.log("📊 Statistiques finales:");
    Object.entries(finalStats).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });

    console.log("\n✅ Migration terminée avec succès!");
    console.log(
      "\n📧 N'oubliez pas de consulter les logs pour récupérer les credentials temporaires des nouveaux comptes."
    );
  } catch (error) {
    console.error("\n❌ Erreur durante la migration:", error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
    console.log("\n🔌 Connexion fermée");
  }
};

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
