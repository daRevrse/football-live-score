// ==================== HOOK PERSONNALISÉ POUR SOCKET ====================
// front-admin/src/hooks/useSocketMatch.js
import { useEffect, useRef } from "react";
import socket from "../services/socket";

export const useSocketMatch = (matchId, callbacks = {}) => {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!matchId) return;

    // Rejoindre la room du match
    socket.emit("joinMatch", matchId);

    // Écouteurs d'événements
    const handleMatchUpdate = (data) => {
      if (callbacksRef.current.onMatchUpdate) {
        callbacksRef.current.onMatchUpdate(data);
      }
    };

    const handleEventAdded = (data) => {
      if (callbacksRef.current.onEventAdded) {
        callbacksRef.current.onEventAdded(data);
      }
    };

    const handleScoreUpdate = (data) => {
      if (callbacksRef.current.onScoreUpdate) {
        callbacksRef.current.onScoreUpdate(data);
      }
    };

    // Ajouter les écouteurs
    socket.on("matchUpdated", handleMatchUpdate);
    socket.on("eventAdded", handleEventAdded);
    socket.on("scoreUpdated", handleScoreUpdate);

    // Nettoyage
    return () => {
      socket.emit("leaveMatch", matchId);
      socket.off("matchUpdated", handleMatchUpdate);
      socket.off("eventAdded", handleEventAdded);
      socket.off("scoreUpdated", handleScoreUpdate);
    };
  }, [matchId]);
};
