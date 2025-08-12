import React, { useEffect, useState } from "react";
import PropTypes from "prop-types"; // Pour la validation des props

export default function MatchPublic({ matchId }) {
  const [scores, setScores] = useState({
    homeScore: 0,
    awayScore: 0,
    homeTeam: "Équipe Domicile",
    awayTeam: "Équipe Extérieure",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const wsUrl = `ws://localhost:3000/matches/${matchId}/updates`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setScores((prev) => ({
          ...prev,
          homeScore: data.homeScore ?? prev.homeScore,
          awayScore: data.awayScore ?? prev.awayScore,
          ...(data.homeTeam && { homeTeam: data.homeTeam }),
          ...(data.awayTeam && { awayTeam: data.awayTeam }),
        }));
      } catch (err) {
        console.error("Erreur parsing WebSocket data:", err);
      }
    };

    socket.onerror = (error) => {
      setError("Connexion WebSocket interrompue");
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [matchId]);

  return (
    <div style={styles.container}>
      <div style={styles.connectionStatus(isConnected)}>
        {isConnected ? "🔵 En direct" : "🔴 Hors ligne"}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.scoreboard}>
        <div style={styles.team}>
          <div style={styles.teamName}>{scores.homeTeam}</div>
          <div style={styles.score}>{scores.homeScore}</div>
        </div>

        <div style={styles.separator}>-</div>

        <div style={styles.team}>
          <div style={styles.score}>{scores.awayScore}</div>
          <div style={styles.teamName}>{scores.awayTeam}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontSize: "2rem",
    textAlign: "center",
    margin: "50px auto",
    maxWidth: "800px",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
  },
  scoreboard: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "40px",
    marginTop: "20px",
  },
  team: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "200px",
  },
  teamName: {
    fontSize: "1.5rem",
    marginBottom: "10px",
    fontWeight: "bold",
  },
  score: {
    fontSize: "3rem",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  separator: {
    fontSize: "2rem",
    margin: "0 10px",
  },
  connectionStatus: (isConnected) => ({
    color: isConnected ? "#27ae60" : "#e74c3c",
    marginBottom: "10px",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
  }),
  error: {
    color: "#e74c3c",
    fontSize: "1rem",
    marginBottom: "10px",
  },
};

MatchPublic.propTypes = {
  matchId: PropTypes.string.isRequired,
};
