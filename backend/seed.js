const db = require("./models");

async function seed() {
  try {
    // Synchroniser la base (⚠ force: true supprime les données)
    await db.sequelize.sync({ force: true });

    console.log("Base synchronisée.");

    // Création des équipes
    const homeTeam = await db.Team.create({
      name: "FC Alpha",
      shortName: "ALP",
    });
    const awayTeam = await db.Team.create({
      name: "United Beta",
      shortName: "BET",
    });

    // Création d’un match
    const match = await db.Match.create({
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeScore: 0,
      awayScore: 0,
      status: "live",
      startAt: new Date(),
    });

    console.log("✅ Données insérées :");
    console.log({
      homeTeam,
      awayTeam,
      match,
    });

    process.exit();
  } catch (err) {
    console.error("Erreur lors du seed :", err);
    process.exit(1);
  }
}

seed();
