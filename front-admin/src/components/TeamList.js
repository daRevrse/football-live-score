import React, { useEffect, useState } from "react";
import { getTeams, deleteTeam } from "../services/api"; // Import des fonctions API
import socket from "../services/socket";
import TeamForm from "./TeamForm";
import TeamItem from "./TeamItem"; // À créer (similaire à MatchEditor)

export default function TeamList() {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeams();

    // Écoute les mises à jour des équipes en temps réel
    socket.on("team_updated", (updatedTeam) => {
      setTeams((prev) =>
        prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
      );
    });

    socket.on("team_created", (newTeam) => {
      setTeams((prev) => [...prev, newTeam]);
    });

    socket.on("team_deleted", (deletedTeamId) => {
      setTeams((prev) => prev.filter((t) => t.id !== deletedTeamId));
    });

    return () => {
      socket.off("team_updated");
      socket.off("team_created");
      socket.off("team_deleted");
    };
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = await getTeams();
      setTeams(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des équipes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
      try {
        await deleteTeam(teamId);
        // La suppression sera gérée par l'événement socket
      } catch (err) {
        setError("Erreur lors de la suppression de l'équipe");
        console.error(err);
      }
    }
  };

  const refreshTeams = () => {
    window.location.reload();
  };

  return (
    <div className="team-list-container">
      <TeamForm onTeamCreated={() => refreshTeams()} />{" "}
      {/* Le socket gère l'ajout */}
      <h2>Liste des équipes</h2>
      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <p>Chargement des équipes...</p>
      ) : teams.length === 0 ? (
        <p>Aucune équipe disponible</p>
      ) : (
        <div className="team-grid">
          {teams.map((team) => (
            <TeamItem key={team.id} team={team} onDelete={handleDeleteTeam} />
          ))}
        </div>
      )}
    </div>
  );
}
