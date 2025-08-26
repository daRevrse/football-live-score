// ==================== MANAGER STATS PAGE ====================
// front-admin/src/pages/manager/TeamStats.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTeamStats, getTeamPlayers } from "../../services/api";
import { Trophy, Target, Users, TrendingUp } from "lucide-react";
import { styles } from "./styles";

const TeamStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (user?.teamId) {
        const [statsResponse, playersResponse] = await Promise.all([
          getTeamStats(user.teamId),
          getTeamPlayers(user.teamId),
        ]);
        setStats(statsResponse.data);
        setPlayers(playersResponse.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Statistiques de l'Équipe</h1>
        <p style={styles.subtitle}>Performances et métriques de votre équipe</p>
      </div>

      {/* Métriques principales */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Trophy size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats?.points || 0}</div>
            <div style={styles.metricLabel}>Points</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Target size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{stats?.goals || 0}</div>
            <div style={styles.metricLabel}>Buts marqués</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Users size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{players.length}</div>
            <div style={styles.metricLabel}>Joueurs</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <TrendingUp size={24} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>
              {stats?.wins || 0}/{stats?.played || 0}
            </div>
            <div style={styles.metricLabel}>Victoires</div>
          </div>
        </div>
      </div>

      {/* Détails des statistiques */}
      <div style={styles.statsSection}>
        <h2 style={styles.sectionTitle}>Détails des Performances</h2>
        <div style={styles.statsTable}>
          <div style={styles.statRow}>
            <span>Matchs joués</span>
            <span>{stats?.played || 0}</span>
          </div>
          <div style={styles.statRow}>
            <span>Victoires</span>
            <span>{stats?.wins || 0}</span>
          </div>
          <div style={styles.statRow}>
            <span>Nuls</span>
            <span>{stats?.draws || 0}</span>
          </div>
          <div style={styles.statRow}>
            <span>Défaites</span>
            <span>{stats?.losses || 0}</span>
          </div>
          <div style={styles.statRow}>
            <span>Buts marqués</span>
            <span>{stats?.goals || 0}</span>
          </div>
          <div style={styles.statRow}>
            <span>Buts encaissés</span>
            <span>{stats?.goalsAgainst || 0}</span>
          </div>
          <div style={styles.statRow}>
            <span>Différence de buts</span>
            <span>{stats?.goalDifference || 0}</span>
          </div>
        </div>
      </div>

      {/* Top joueurs */}
      <div style={styles.playersSection}>
        <h2 style={styles.sectionTitle}>Effectif</h2>
        <div style={styles.playersList}>
          {players.slice(0, 10).map((player) => (
            <div key={player.id} style={styles.playerCard}>
              <div style={styles.playerInfo}>
                <div style={styles.playerName}>{player.name}</div>
                <div style={styles.playerPosition}>{player.position}</div>
              </div>
              <div style={styles.playerStats}>
                <span style={styles.playerStat}>{player.goals || 0} buts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { TeamStats };
