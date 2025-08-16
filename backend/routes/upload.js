// backend/routes/upload.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// Configuration de stockage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/logos");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Générer un nom unique : timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

// Filtres et limites
const fileFilter = (req, file, cb) => {
  // Types MIME autorisés
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1, // 1 fichier à la fois
  },
});

// Route d'upload pour les logos
router.post("/logo", upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    // Construire l'URL publique
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Informations sur le fichier uploadé
    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: logoUrl,
      fullPath: req.file.path,
    };

    console.log("Logo uploadé:", fileInfo);

    res.status(201).json({
      message: "Logo uploadé avec succès",
      logoUrl: logoUrl,
      fileInfo: fileInfo,
    });
  } catch (error) {
    console.error("Erreur upload logo:", error);

    // Nettoyer le fichier en cas d'erreur
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Erreur nettoyage fichier:", cleanupError);
      }
    }

    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});

// Route pour supprimer un logo
router.delete("/logo", async (req, res) => {
  try {
    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json({ error: "URL du logo requise" });
    }

    // Extraire le nom du fichier de l'URL
    const filename = path.basename(logoUrl);
    const filePath = path.join(__dirname, "../uploads/logos", filename);

    // Vérifier si le fichier existe et le supprimer
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      res.json({ message: "Logo supprimé avec succès" });
    } catch (error) {
      if (error.code === "ENOENT") {
        return res.status(404).json({ error: "Fichier non trouvé" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erreur suppression logo:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// Route pour lister les logos disponibles
router.get("/logos", async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "../uploads/logos");

    try {
      const files = await fs.readdir(uploadsDir);
      const logoFiles = files
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map((file) => ({
          filename: file,
          url: `/uploads/logos/${file}`,
          fullPath: path.join(uploadsDir, file),
        }));

      res.json(logoFiles);
    } catch (error) {
      if (error.code === "ENOENT") {
        // Le dossier n'existe pas encore
        return res.json([]);
      }
      throw error;
    }
  } catch (error) {
    console.error("Erreur listage logos:", error);
    res.status(500).json({ error: "Erreur lors du listage" });
  }
});

// Middleware de gestion d'erreurs pour multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res
          .status(400)
          .json({ error: "Fichier trop volumineux (max 5MB)" });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({ error: "Trop de fichiers (max 1)" });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({ error: "Champ de fichier inattendu" });
      default:
        return res
          .status(400)
          .json({ error: `Erreur d'upload: ${error.message}` });
    }
  }

  if (error.message.includes("Type de fichier non autorisé")) {
    return res.status(400).json({ error: error.message });
  }

  next(error);
});

module.exports = router;
