import React from "react";
import { User, Mail, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const styles = {
    container: {
      //   maxWidth: "600px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      alignItems: "center",
      marginBottom: "24px",
    },
    backButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginRight: "16px",
      color: "#3b82f6",
      background: "none",
      border: "none",
      cursor: "pointer",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    },
    infoItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
      paddingBottom: "16px",
      borderBottom: "1px solid #f3f4f6",
    },
    icon: {
      color: "#6b7280",
    },
    label: {
      fontWeight: "500",
      color: "#6b7280",
      minWidth: "120px",
    },
    value: {
      flex: 1,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={18} />
          Retour
        </button>
        <h1 style={styles.title}>Mon Profil</h1>
      </div>

      <div style={styles.card}>
        <div style={styles.infoItem}>
          <User size={20} style={styles.icon} />
          <span style={styles.label}>Nom d'utilisateur</span>
          <span style={styles.value}>{user?.username}</span>
        </div>
        <div style={styles.infoItem}>
          <Mail size={20} style={styles.icon} />
          <span style={styles.label}>Email</span>
          <span style={styles.value}>{user?.email}</span>
        </div>
        <div style={styles.infoItem}>
          <Shield size={20} style={styles.icon} />
          <span style={styles.label}>Rôle</span>
          <span style={styles.value}>{user?.role}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
