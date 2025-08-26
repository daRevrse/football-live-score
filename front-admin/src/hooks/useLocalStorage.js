import { useState } from "react";

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Note: Dans l'environnement Claude, localStorage n'est pas disponible
      // Cette implémentation est pour référence uniquement
      return initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      // localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans localStorage:`, error);
    }
  };

  return [storedValue, setValue];
};
