// ==================== UTILITAIRES POUR LES LOGOS ====================
// front-admin/src/utils/imageUtils.js
export const getTeamLogoUrl = (team) => {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  if (team?.logo) {
    // Si le logo est déjà une URL complète
    if (team.logo.startsWith("http")) {
      return team.logo;
    }
    // Si c'est juste le nom de fichier
    return `${baseUrl}/uploads/${team.logo}`;
  }

  return null;
};

export const handleImageError = (e, fallbackSrc = null) => {
  if (fallbackSrc) {
    e.target.src = fallbackSrc;
  } else {
    e.target.style.display = "none";
  }
};

// Fonction pour précharger les images
export const preloadTeamLogos = async (teams) => {
  const promises = teams
    .filter((team) => team.logo)
    .map((team) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = getTeamLogoUrl(team);
      });
    });

  await Promise.all(promises);
};
