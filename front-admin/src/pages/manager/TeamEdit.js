// ==================== MANAGER TEAM EDIT PAGE ====================
// front-admin/src/pages/manager/TeamEdit.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateTeamInfo, getTeam } from "../../services/api";
import { Save, Upload, AlertCircle } from "lucide-react";
import { styles } from "./styles";

const TeamEdit = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState({
    name: "",
    description: "",
    stadium: "",
    founded: "",
    colors: "",
    logo: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      if (user?.teamId) {
        const response = await getTeam(user.teamId);
        setTeamData({
          name: response.data.name || "",
          description: response.data.description || "",
          stadium: response.data.stadium || "",
          founded: response.data.founded || "",
          colors: response.data.colors || "",
          logo: null,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await updateTeamInfo(user.teamId, teamData);
      setMessage("Informations mises à jour avec succès");
    } catch (error) {
      setMessage("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTeamData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Chargement des informations...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Informations de l'Équipe</h1>
        <p style={styles.subtitle}>Modifiez les informations de votre équipe</p>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            backgroundColor: message.includes("succès") ? "#d1fae5" : "#fee2e2",
            color: message.includes("succès") ? "#065f46" : "#dc2626",
          }}
        >
          <AlertCircle size={16} />
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nom de l'équipe</label>
          <input
            type="text"
            value={teamData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            value={teamData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            style={styles.textarea}
            rows={4}
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Stade</label>
            <input
              type="text"
              value={teamData.stadium}
              onChange={(e) => handleInputChange("stadium", e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Année de fondation</label>
            <input
              type="number"
              value={teamData.founded}
              onChange={(e) => handleInputChange("founded", e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Couleurs de l'équipe</label>
          <input
            type="text"
            value={teamData.colors}
            onChange={(e) => handleInputChange("colors", e.target.value)}
            style={styles.input}
            placeholder="Ex: Rouge et Blanc"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Logo de l'équipe</label>
          <div style={styles.fileUpload}>
            <Upload size={20} />
            <span>Cliquez pour sélectionner un logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleInputChange("logo", e.target.files[0])}
              style={styles.fileInput}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} style={styles.submitButton}>
          <Save size={16} />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
};

export { TeamEdit };
