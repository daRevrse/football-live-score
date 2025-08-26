// front-admin/src/components/manager/PlayerModal.js
import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { createPlayer, updatePlayer } from "../../services/api";

export default function PlayerModal({ player, teamId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    jerseyNumber: "",
    position: "",
    dateOfBirth: "",
    nationality: "",
    height: "",
    weight: "",
    photoUrl: "",
    contractStart: "",
    contractEnd: "",
    salary: "",
    biography: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const positions = [
    "Gardien",
    "Défenseur central",
    "Latéral droit",
    "Latéral gauche",
    "Milieu défensif",
    "Milieu central",
    "Milieu offensif",
    "Ailier droit",
    "Ailier gauche",
    "Attaquant",
    "Avant-centre",
  ];

  const statuses = [
    { value: "active", label: "Actif" },
    { value: "injured", label: "Blessé" },
    { value: "suspended", label: "Suspendu" },
    { value: "inactive", label: "Inactif" },
  ];

  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        jerseyNumber: player.jerseyNumber || "",
        position: player.position || "",
        dateOfBirth: player.dateOfBirth || "",
        nationality: player.nationality || "",
        height: player.height || "",
        weight: player.weight || "",
        photoUrl: player.photoUrl || "",
        contractStart: player.contractStart || "",
        contractEnd: player.contractEnd || "",
        salary: player.salary || "",
        biography: player.biography || "",
        status: player.status || "active",
      });
    }
  }, [player]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est obligatoire";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est obligatoire";
    }

    if (
      !formData.jerseyNumber ||
      formData.jerseyNumber < 1 ||
      formData.jerseyNumber > 99
    ) {
      newErrors.jerseyNumber = "Le numéro doit être entre 1 et 99";
    }

    if (!formData.position) {
      newErrors.position = "La position est obligatoire";
    }

    if (formData.height && (formData.height < 120 || formData.height > 250)) {
      newErrors.height = "La taille doit être entre 120 et 250 cm";
    }

    if (formData.weight && (formData.weight < 40 || formData.weight > 150)) {
      newErrors.weight = "Le poids doit être entre 40 et 150 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const playerData = {
        ...formData,
        teamId,
        jerseyNumber: parseInt(formData.jerseyNumber),
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
      };

      if (player) {
        await updatePlayer(player.id, playerData);
      } else {
        await createPlayer(playerData);
      }

      onSuccess();
    } catch (error) {
      if (error.response?.data?.details) {
        const serverErrors = {};
        error.response.data.details.forEach((detail) => {
          if (detail.includes("Jersey number")) {
            serverErrors.jerseyNumber = "Ce numéro est déjà pris";
          }
        });
        setErrors(serverErrors);
      } else {
        setErrors({ general: "Erreur lors de la sauvegarde" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      width: "90%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
    },
    header: {
      padding: "20px 24px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f5f7fa",
      position: "sticky",
      top: 0,
    },
    title: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1e293b",
      margin: 0,
    },
    closeButton: {
      padding: "8px",
      border: "none",
      borderRadius: "6px",
      backgroundColor: "transparent",
      cursor: "pointer",
      color: "#64748b",
      transition: "all 0.2s ease",
    },
    content: {
      padding: "24px",
      maxHeight: "calc(90vh - 140px)",
      overflowY: "auto",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      marginBottom: "50px",
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
    },
    required: {
      color: "#ef4444",
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s ease",
    },
    inputError: {
      borderColor: "#ef4444",
    },
    select: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "white",
      cursor: "pointer",
    },
    textarea: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      resize: "vertical",
      minHeight: "80px",
    },
    errorText: {
      fontSize: "12px",
      color: "#ef4444",
      marginTop: "4px",
    },
    footer: {
      padding: "20px 24px",
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      backgroundColor: "white",
      position: "sticky",
      bottom: 0,
    },
    button: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    buttonSecondary: {
      backgroundColor: "#f1f5f9",
      color: "#475569",
    },
    buttonPrimary: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    generalError: {
      padding: "12px",
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      borderRadius: "8px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {player ? "Modifier le joueur" : "Ajouter un joueur"}
          </h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#f1f5f9")}
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            <X size={20} />
          </button>
        </div>

        <div style={styles.content}>
          {errors.general && (
            <div style={styles.generalError}>
              <AlertCircle size={16} />
              {errors.general}
            </div>
          )}

          <form style={styles.form} onSubmit={handleSubmit}>
            {/* Informations de base */}
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Prénom <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.firstName ? styles.inputError : {}),
                  }}
                  placeholder="ex: Lionel"
                />
                {errors.firstName && (
                  <div style={styles.errorText}>{errors.firstName}</div>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Nom <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.lastName ? styles.inputError : {}),
                  }}
                  placeholder="ex: Messi"
                />
                {errors.lastName && (
                  <div style={styles.errorText}>{errors.lastName}</div>
                )}
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Numéro de maillot <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formData.jerseyNumber}
                  onChange={(e) => handleChange("jerseyNumber", e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.jerseyNumber ? styles.inputError : {}),
                  }}
                  placeholder="ex: 10"
                />
                {errors.jerseyNumber && (
                  <div style={styles.errorText}>{errors.jerseyNumber}</div>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Position <span style={styles.required}>*</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  style={{
                    ...styles.select,
                    ...(errors.position ? styles.inputError : {}),
                  }}
                >
                  <option value="">Sélectionnez une position</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                {errors.position && (
                  <div style={styles.errorText}>{errors.position}</div>
                )}
              </div>
            </div>

            {/* Informations personnelles */}
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date de naissance</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nationalité</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  style={styles.input}
                  placeholder="ex: Argentine"
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Taille (cm)</label>
                <input
                  type="number"
                  min="120"
                  max="250"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.height ? styles.inputError : {}),
                  }}
                  placeholder="ex: 170"
                />
                {errors.height && (
                  <div style={styles.errorText}>{errors.height}</div>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Poids (kg)</label>
                <input
                  type="number"
                  min="40"
                  max="150"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.weight ? styles.inputError : {}),
                  }}
                  placeholder="ex: 72"
                />
                {errors.weight && (
                  <div style={styles.errorText}>{errors.weight}</div>
                )}
              </div>
            </div>

            {/* Photo et statut */}
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>URL de la photo</label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => handleChange("photoUrl", e.target.value)}
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  style={styles.select}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Informations contrat */}
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Début de contrat</label>
                <input
                  type="date"
                  value={formData.contractStart}
                  onChange={(e) =>
                    handleChange("contractStart", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Fin de contrat</label>
                <input
                  type="date"
                  value={formData.contractEnd}
                  onChange={(e) => handleChange("contractEnd", e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Salaire (€/mois)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
                style={styles.input}
                placeholder="ex: 5000"
              />
            </div>

            {/* Biographie */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Biographie</label>
              <textarea
                value={formData.biography}
                onChange={(e) => handleChange("biography", e.target.value)}
                style={styles.textarea}
                placeholder="Informations complémentaires sur le joueur..."
              />
            </div>
          </form>
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
