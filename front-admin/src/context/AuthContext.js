// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiRegister, getUserProfile } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getUserProfile();
        setUser(response.data);
      } catch (error) {
        console.error("Auth check failed:", error);
        // Si l'authentification échoue, on peut soit rediriger vers la page de connexion,
        // soit supprimer le token et rediriger vers la page de connexion
        navigate("/login");
        // logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Chargement...</div>; // Ou un spinner
  }

  // if (!user) {
  //   return <div>Non connecté</div>; // Ou une page de connexion
  // }

  const login = async (credentials) => {
    try {
      //   const { data } = await api.post("/auth/login", credentials);
      const { data } = await apiLogin(credentials);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      setUser(data.user);
      navigate("/");
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      //   const { data } = await api.post("/auth/register", userData);
      const { data } = await apiRegister(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      setUser(data.user);
      navigate("/");
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    // setUser(null);
    navigate("/login");
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
