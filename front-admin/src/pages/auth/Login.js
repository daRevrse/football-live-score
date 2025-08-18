import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login({ email, password });
    if (!result.success) {
      setError(result.error);
    }
  };

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f5f7fa",
      flexDirection: "column",
    },
    stayOffline: {
      color: "#64748b",
      fontSize: "14px",
      marginTop: "16px",
      textAlign: "center",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      padding: "32px",
      width: "400px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#111827",
      marginBottom: "24px",
      textAlign: "center",
    },
    inputGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    inputIcon: {
      marginRight: "10px",
      color: "#6b7280",
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      marginTop: "8px",
    },
    error: {
      color: "#ef4444",
      fontSize: "14px",
      marginTop: "16px",
      textAlign: "center",
    },
    link: {
      color: "#3b82f6",
      textDecoration: "none",
      fontWeight: "500",
    },
    footer: {
      marginTop: "24px",
      textAlign: "center",
      fontSize: "14px",
      color: "#6b7280",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Connexion</h1>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
            </div>
          </div>
          <button type="submit" style={styles.button}>
            Se connecter
          </button>
        </form>
        <div style={styles.footer}>
          Pas encore de compte ?{" "}
          <a href="/register" style={styles.link}>
            S'inscrire
          </a>
        </div>
      </div>
      <span style={styles.stayOffline}>
        <a href="/" style={styles.stayOffline}>
          Resté deconnecté
        </a>
      </span>
    </div>
  );
}
