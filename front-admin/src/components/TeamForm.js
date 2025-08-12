import React, { useState } from "react";
import { createTeam } from "../services/api"; // Import de la fonction depuis votre API

export default function TeamForm({ onTeamCreated }) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation côté client
    if (!name.trim() || !shortName.trim()) {
      setError("Le nom et le sigle sont obligatoires");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const teamData = {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
      };

      // Utilisation de la fonction createTeam de votre API
      const response = await createTeam(teamData);

      // Réinitialisation du formulaire
      setName("");
      setShortName("");

      // Callback pour informer le parent
      if (onTeamCreated) {
        onTeamCreated(response.data);
      }
    } catch (err) {
      // Gestion des erreurs spécifiques de l'API
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Une erreur est survenue lors de la création de l'équipe");
      }
      console.error("Erreur création équipe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="team-form">
      <h3>Créer une nouvelle équipe</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Nom complet *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          placeholder="ex: Paris Saint-Germain"
          maxLength={50}
        />
      </div>

      <div className="form-group">
        <label htmlFor="shortName">Sigle *</label>
        <input
          id="shortName"
          type="text"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          disabled={isLoading}
          placeholder="ex: PSG"
          maxLength={10}
        />
        <small>3 à 10 caractères, sera converti en majuscules</small>
      </div>

      <button
        type="submit"
        disabled={isLoading || !name.trim() || !shortName.trim()}
        className="submit-button"
      >
        {isLoading ? "Création en cours..." : "Créer l'équipe"}
      </button>
    </form>
  );
}
