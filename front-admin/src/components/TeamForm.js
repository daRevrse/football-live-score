import React, { useState } from "react";
import { createTeam, uploadLogo, deleteLogo, API_URL } from "../services/api";
import {
  AlertCircle,
  Check,
  Loader2,
  Camera,
  Palette,
  Upload,
  X,
  Image,
} from "lucide-react";

export default function TeamForm({ onTeamCreated, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    logoUrl: "",
    primaryColor: "#1f2937",
    secondaryColor: "#3b82f6",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [urlLogo, setUrlLogo] = useState("");

  // Styles CSS intégrés
  const styles = {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      overflow: "hidden",
    },
    header: {
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      padding: "20px 24px",
      color: "white",
    },
    headerTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    headerIcon: {
      width: "32px",
      height: "32px",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    form: {
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    alert: {
      padding: "16px",
      borderRadius: "8px",
      border: "1px solid",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
    },
    alertError: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      color: "#991b1b",
    },
    alertSuccess: {
      backgroundColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      color: "#166534",
    },
    gridRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "24px",
    },
    fieldGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    required: {
      color: "#ef4444",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "16px",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    inputError: {
      borderColor: "#f87171",
      backgroundColor: "#fef2f2",
    },
    inputDisabled: {
      opacity: "0.5",
      cursor: "not-allowed",
    },
    errorText: {
      fontSize: "14px",
      color: "#dc2626",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    helpText: {
      fontSize: "12px",
      color: "#6b7280",
    },
    colorSection: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    colorGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
    },
    colorInput: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    colorPicker: {
      width: "48px",
      height: "48px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      cursor: "pointer",
    },
    colorTextInput: {
      flex: 1,
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
    },
    preview: {
      backgroundColor: "#f9fafb",
      borderRadius: "8px",
      padding: "16px",
    },
    previewColors: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginTop: "8px",
    },
    previewColor: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    colorSwatch: {
      width: "24px",
      height: "24px",
      borderRadius: "4px",
      border: "1px solid #d1d5db",
    },
    gradientPreview: {
      height: "32px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "14px",
      fontWeight: "500",
      marginLeft: "auto",
      minWidth: "120px",
    },
    logoPreview: {
      marginTop: "8px",
    },
    logoImage: {
      width: "64px",
      height: "64px",
      objectFit: "contain",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
    },
    actions: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "12px",
      paddingTop: "16px",
      borderTop: "1px solid #e5e7eb",
    },
    button: {
      padding: "10px 24px",
      borderRadius: "8px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "none",
      fontSize: "14px",
    },
    buttonSecondary: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    },
    buttonSecondaryHover: {
      backgroundColor: "#e5e7eb",
    },
    buttonPrimary: {
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      color: "white",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
    buttonPrimaryHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
    },
    uploadZone: {
      border: "2px dashed #d1d5db",
      borderRadius: "8px",
      padding: "24px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: "#fafafa",
    },
    uploadZoneActive: {
      borderColor: "#3b82f6",
      backgroundColor: "#eff6ff",
    },
    uploadZoneError: {
      borderColor: "#f87171",
      backgroundColor: "#fef2f2",
    },
    uploadIcon: {
      width: "48px",
      height: "48px",
      margin: "0 auto 12px",
      color: "#6b7280",
    },
    uploadText: {
      fontSize: "16px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "4px",
    },
    uploadSubtext: {
      fontSize: "14px",
      color: "#6b7280",
    },
    logoContainer: {
      position: "relative",
      display: "inline-block",
    },
    logoDelete: {
      position: "absolute",
      top: "-8px",
      right: "-8px",
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "24px",
      height: "24px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
    },
    progressBar: {
      width: "100%",
      height: "4px",
      backgroundColor: "#e5e7eb",
      borderRadius: "2px",
      overflow: "hidden",
      marginTop: "8px",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3b82f6",
      borderRadius: "2px",
      transition: "width 0.3s ease",
    },
    buttonDisabled: {
      backgroundColor: "#d1d5db",
      color: "#9ca3af",
      cursor: "not-allowed",
      transform: "none",
      boxShadow: "none",
    },
  };

  // Gestion de l'upload de fichier
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    if (file.size > maxSize) {
      setError("Fichier trop volumineux. Taille maximum: 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulation de progression (vous pouvez utiliser XMLHttpRequest pour un vrai suivi)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 5000);

      const response = await uploadLogo(file);

      console.log("response", response);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Mettre à jour l'URL du logo
      setUrlLogo(`${API_URL}${response.data.logoUrl}`);
      // handleInputChange("logoUrl", `${API_URL}${response.logoUrl}`);
      setFormData((prev) => ({
        ...prev,
        logoUrl: `${API_URL}${response.data.logoUrl}`,
      }));

      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
    } catch (error) {
      setUploadProgress(0);
      setIsUploading(false);
      setError(error.message || "Erreur lors de l'upload");
    }
  };

  // Gestion du drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Suppression du logo
  const handleDeleteLogo = async () => {
    if (!formData.logoUrl) return;

    try {
      if (formData.logoUrl.startsWith("/uploads/")) {
        // C'est un fichier uploadé, le supprimer du serveur
        await deleteLogo(formData.logoUrl);
      }

      handleInputChange("logoUrl", "");
    } catch (error) {
      console.error("Erreur suppression logo:", error);
      // On supprime quand même l'URL du formulaire
      handleInputChange("logoUrl", "");
    }
  };

  // Validation en temps réel
  const validateField = (name, value) => {
    const errors = {};

    switch (name) {
      case "name":
        if (!value.trim()) {
          errors.name = "Le nom est obligatoire";
        } else if (value.trim().length < 2) {
          errors.name = "Le nom doit contenir au moins 2 caractères";
        } else if (value.trim().length > 100) {
          errors.name = "Le nom ne peut pas dépasser 100 caractères";
        }
        break;

      case "shortName":
        if (!value.trim()) {
          errors.shortName = "Le sigle est obligatoire";
        } else if (value.trim().length < 1) {
          errors.shortName = "Le sigle doit contenir au moins 1 caractère";
        } else if (value.trim().length > 10) {
          errors.shortName = "Le sigle ne peut pas dépasser 10 caractères";
        }
        break;

      case "logoUrl":
        if (value && !/^https?:\/\/.+/i.test(value)) {
          errors.logoUrl = "L'URL doit commencer par http:// ou https://";
        }
        break;

      case "primaryColor":
      case "secondaryColor":
        if (value && !/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
          errors[name] = "Format de couleur invalide (ex: #FF0000)";
        }
        break;
    }

    return errors;
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value, logoUrl: urlLogo }));

    // Validation en temps réel
    const fieldErrors = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      ...fieldErrors,
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined }),
    }));

    // Effacer les messages d'erreur/succès globaux
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const fieldErrors = validateField(key, formData[key]);
      Object.assign(errors, fieldErrors);
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log("urlLogo", urlLogo);
    console.log("formdata", formData.logoUrl);

    try {
      const teamData = {
        name: formData.name.trim(),
        shortName: formData.shortName.trim().toUpperCase(),
        logoUrl: urlLogo || formData.logoUrl,
        primaryColor: formData.primaryColor || null,
        secondaryColor: formData.secondaryColor || null,
      };

      console.log("teamData", teamData);

      const response = await createTeam(teamData);

      // Animation de succès
      setSuccess(true);

      // Délai pour montrer le succès avant de réinitialiser
      setTimeout(() => {
        setFormData({
          name: "",
          shortName: "",
          logoUrl: "",
          primaryColor: "#1f2937",
          secondaryColor: "#3b82f6",
        });
        setSuccess(false);

        if (onTeamCreated) {
          onTeamCreated(response);
        }
      }, 1500);
    } catch (err) {
      if (err.response?.data?.details) {
        // Erreurs de validation du serveur
        const serverErrors = {};
        err.response.data.details.forEach((detail) => {
          if (detail.includes("name")) serverErrors.name = detail;
          if (detail.includes("shortName") || detail.includes("short name"))
            serverErrors.shortName = detail;
          if (detail.includes("logoUrl") || detail.includes("logo"))
            serverErrors.logoUrl = detail;
          if (
            detail.includes("primaryColor") ||
            detail.includes("primary color")
          )
            serverErrors.primaryColor = detail;
          if (
            detail.includes("secondaryColor") ||
            detail.includes("secondary color")
          )
            serverErrors.secondaryColor = detail;
        });
        setValidationErrors(serverErrors);
        setError("Erreurs de validation détectées");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Une erreur est survenue lors de la création de l'équipe");
      }
      console.error("Erreur création équipe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    Object.keys(validationErrors).every((key) => !validationErrors[key]) &&
    formData.name.trim() &&
    formData.shortName.trim();

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        {/* Messages globaux */}
        {error && (
          <div style={{ ...styles.alert, ...styles.alertError }}>
            <AlertCircle
              size={20}
              style={{ marginTop: "2px", flexShrink: 0 }}
            />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>
            <Check size={20} />
            <div style={{ fontWeight: "500" }}>Équipe créée avec succès !</div>
          </div>
        )}

        {/* Informations de base */}
        <div style={styles.gridRow}>
          <div style={styles.fieldGroup}>
            <label htmlFor="name" style={styles.label}>
              Nom complet <span style={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
              placeholder="ex: Paris Saint-Germain"
              maxLength={100}
              style={{
                ...styles.input,
                ...(validationErrors.name ? styles.inputError : {}),
                ...(isLoading ? styles.inputDisabled : {}),
              }}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => {
                e.target.style.borderColor = validationErrors.name
                  ? "#f87171"
                  : "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {validationErrors.name && (
              <div style={styles.errorText}>
                <AlertCircle size={16} />
                {validationErrors.name}
              </div>
            )}
            <div style={styles.helpText}>
              {formData.name.length}/100 caractères
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="shortName" style={styles.label}>
              Sigle <span style={styles.required}>*</span>
            </label>
            <input
              id="shortName"
              type="text"
              value={formData.shortName}
              onChange={(e) =>
                handleInputChange("shortName", e.target.value.toUpperCase())
              }
              disabled={isLoading}
              placeholder="ex: PSG"
              maxLength={10}
              style={{
                ...styles.input,
                ...(validationErrors.shortName ? styles.inputError : {}),
                ...(isLoading ? styles.inputDisabled : {}),
              }}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => {
                e.target.style.borderColor = validationErrors.shortName
                  ? "#f87171"
                  : "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {validationErrors.shortName && (
              <div style={styles.errorText}>
                <AlertCircle size={16} />
                {validationErrors.shortName}
              </div>
            )}
            <div style={styles.helpText}>
              Converti automatiquement en majuscules •{" "}
              {formData.shortName.length}/10
            </div>
          </div>
        </div>

        {/* Logo avec upload */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            <Camera size={16} />
            Logo de l'équipe
          </label>

          {!formData.logoUrl && !urlLogo ? (
            <>
              {/* Zone d'upload */}
              <div
                style={{
                  ...styles.uploadZone,
                  ...(dragActive ? styles.uploadZoneActive : {}),
                  ...(validationErrors.logoUrl ? styles.uploadZoneError : {}),
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("logoFileInput").click()}
              >
                {isUploading ? (
                  <div>
                    <Loader2
                      size={48}
                      style={{
                        ...styles.uploadIcon,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <div style={styles.uploadText}>Upload en cours...</div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${uploadProgress}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={48} style={styles.uploadIcon} />
                    <div style={styles.uploadText}>
                      Cliquez ou glissez-déposez votre logo
                    </div>
                    <div style={styles.uploadSubtext}>
                      JPG, PNG, GIF ou WebP • Max 5MB
                    </div>
                  </div>
                )}
              </div>

              <input
                id="logoFileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                style={{ display: "none" }}
              />

              {/* Option URL manuelle */}
              <div style={{ marginTop: "16px" }}>
                <label
                  style={{
                    ...styles.helpText,
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Ou entrez une URL d'image :
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                  disabled={isLoading}
                  placeholder="https://exemple.com/logo.png"
                  style={{
                    ...styles.input,
                    ...(validationErrors.logoUrl ? styles.inputError : {}),
                    ...(isLoading ? styles.inputDisabled : {}),
                  }}
                  onFocus={(e) =>
                    Object.assign(e.target.style, styles.inputFocus)
                  }
                  onBlur={(e) => {
                    e.target.style.borderColor = validationErrors.logoUrl
                      ? "#f87171"
                      : "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </>
          ) : (
            /* Aperçu du logo */
            <div style={styles.logoContainer}>
              <img
                src={urlLogo}
                alt="Logo de l'équipe"
                style={styles.logoImage}
                onError={(e) => {
                  e.target.style.display = "none";
                  handleInputChange("logoUrl", "");
                }}
              />
              <button
                type="button"
                onClick={handleDeleteLogo}
                style={styles.logoDelete}
                title="Supprimer le logo"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {validationErrors.logoUrl && (
            <div style={styles.errorText}>
              <AlertCircle size={16} />
              {validationErrors.logoUrl}
            </div>
          )}
        </div>

        {/* Couleurs */}
        <div style={styles.colorSection}>
          <label style={styles.label}>
            <Palette size={16} />
            Couleurs de l'équipe (optionnel)
          </label>

          <div style={styles.colorGrid}>
            <div style={styles.fieldGroup}>
              <label
                htmlFor="primaryColor"
                style={{ ...styles.helpText, fontWeight: "500" }}
              >
                Couleur principale
              </label>
              <div style={styles.colorInput}>
                <input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    handleInputChange("primaryColor", e.target.value)
                  }
                  disabled={isLoading}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    handleInputChange("primaryColor", e.target.value)
                  }
                  disabled={isLoading}
                  placeholder="#1f2937"
                  style={{
                    ...styles.colorTextInput,
                    ...(validationErrors.primaryColor ? styles.inputError : {}),
                  }}
                />
              </div>
              {validationErrors.primaryColor && (
                <div style={styles.errorText}>
                  {validationErrors.primaryColor}
                </div>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="secondaryColor"
                style={{ ...styles.helpText, fontWeight: "500" }}
              >
                Couleur secondaire
              </label>
              <div style={styles.colorInput}>
                <input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    handleInputChange("secondaryColor", e.target.value)
                  }
                  disabled={isLoading}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    handleInputChange("secondaryColor", e.target.value)
                  }
                  disabled={isLoading}
                  placeholder="#3b82f6"
                  style={{
                    ...styles.colorTextInput,
                    ...(validationErrors.secondaryColor
                      ? styles.inputError
                      : {}),
                  }}
                />
              </div>
              {validationErrors.secondaryColor && (
                <div style={styles.errorText}>
                  {validationErrors.secondaryColor}
                </div>
              )}
            </div>
          </div>

          {/* Aperçu des couleurs */}
          <div style={styles.preview}>
            <div
              style={{
                ...styles.helpText,
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Aperçu des couleurs :
            </div>
            <div style={styles.previewColors}>
              <div style={styles.previewColor}>
                <div
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: formData.primaryColor,
                  }}
                ></div>
                <span style={styles.helpText}>Principale</span>
              </div>
              <div style={styles.previewColor}>
                <div
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: formData.secondaryColor,
                  }}
                ></div>
                <span style={styles.helpText}>Secondaire</span>
              </div>
              <div
                style={{
                  ...styles.gradientPreview,
                  background: `linear-gradient(45deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
                }}
              >
                {formData.shortName || "ÉQUIPE"}
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={styles.actions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) =>
                !isLoading &&
                Object.assign(e.target.style, styles.buttonSecondaryHover)
              }
              onMouseLeave={(e) =>
                !isLoading &&
                Object.assign(e.target.style, styles.buttonSecondary)
              }
            >
              Annuler
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
            style={{
              ...styles.button,
              ...(isFormValid && !isLoading
                ? styles.buttonPrimary
                : styles.buttonDisabled),
            }}
            onMouseEnter={(e) => {
              if (isFormValid && !isLoading) {
                Object.assign(e.target.style, {
                  ...styles.buttonPrimary,
                  ...styles.buttonPrimaryHover,
                });
              }
            }}
            onMouseLeave={(e) => {
              if (isFormValid && !isLoading) {
                Object.assign(e.target.style, styles.buttonPrimary);
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Création en cours...
              </>
            ) : success ? (
              <>
                <Check size={16} />
                Créé !
              </>
            ) : (
              "Créer l'équipe"
            )}
          </button>
        </div>
      </div>

      {/* Animation CSS pour le loader */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
