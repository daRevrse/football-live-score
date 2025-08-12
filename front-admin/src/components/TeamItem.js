import React from "react";

export default function TeamItem({ team, onDelete }) {
  return (
    <div className="team-card">
      <div className="team-header">
        <span className="team-short-name">{team.shortName}</span>
        <button onClick={() => onDelete(team.id)} className="delete-button">
          Supprimer
        </button>
      </div>
      <div className="team-name">{team.name}</div>

      {/* Vous pourriez ajouter d'autres informations ici */}
      {/* Par exemple : nombre de matchs, statistiques, etc. */}
    </div>
  );
}
