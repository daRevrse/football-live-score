// src/layouts/UserSection.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { User as UserIcon, LogIn, LogOut, Settings } from "lucide-react";
import { styles } from "./styles";
import { useAuth } from "../context/AuthContext";

const UserSection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogin = () => navigate("/login");

  return (
    <div style={styles.userSection}>
      {user ? (
        <>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              <UserIcon size={18} />
            </div>
            <div style={styles.userDetails}>
              <div style={styles.username}>{user.username}</div>
              {user.role === "User" ? null : (
                <div style={styles.role}>{user.role}</div>
              )}
            </div>
          </div>
          <div style={styles.userMenu}>
            <NavLink
              to="/profile"
              style={({ isActive }) => ({
                ...styles.userMenuItem,
                ...(isActive && { backgroundColor: "#f0f5ff" }),
              })}
            >
              <Settings size={16} />
              Mon profil
            </NavLink>
            <button
              onClick={logout}
              style={{
                ...styles.logoutMenuItem,
                background: "#ef444410",
                border: "none",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </>
      ) : (
        <button onClick={handleLogin} style={styles.loginButton}>
          <LogIn size={16} />
          Connexion
        </button>
      )}
    </div>
  );
};

export default UserSection;
