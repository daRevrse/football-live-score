import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  NavLink,
} from "react-router-dom";
import { LayoutDashboard, Trophy, Users, Calendar, Home } from "lucide-react";
import MatchList from "./components/MatchList";
import TeamList from "./components/TeamList";
import PublicMatchList from "./components/PublicMatchList";

export default function App() {
  // Styles CSS intégrés
  const styles = {
    appContainer: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f5f7fa",
    },
    sidebar: {
      width: "240px",
      backgroundColor: "white",
      boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
      padding: "24px 0",
      position: "sticky",
      top: 0,
      height: "100vh",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "0 24px 24px",
      marginBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
    },
    logoIcon: {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
    },
    logoText: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#111827",
    },
    nav: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      padding: "0 16px",
    },
    navLink: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "8px",
      textDecoration: "none",
      color: "#6b7280",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    navLinkActive: {
      backgroundColor: "#f0f5ff",
      color: "#3b82f6",
    },
    navLinkHover: {
      backgroundColor: "#f9fafb",
    },
    navLinkIcon: {
      width: "20px",
      height: "20px",
    },
    mainContent: {
      flex: 1,
      padding: "32px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "32px",
    },
    pageTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#111827",
    },
    contentCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      padding: "24px",
    },
  };

  return (
    <Router>
      <div style={styles.appContainer}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <LayoutDashboard size={18} />
            </div>
            <span style={styles.logoText}>SportDashboard</span>
          </div>

          <nav style={styles.nav}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive && styles.navLinkActive),
              })}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.navLinkHover)
              }
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "";
              }}
            >
              <Home size={18} style={styles.navLinkIcon} />
              Accueil
            </NavLink>
            <NavLink
              to="/matches"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive && styles.navLinkActive),
              })}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.navLinkHover)
              }
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "";
              }}
            >
              <Calendar size={18} style={styles.navLinkIcon} />
              Matchs
            </NavLink>
            <NavLink
              to="/teams"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive && styles.navLinkActive),
              })}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.navLinkHover)
              }
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "";
              }}
            >
              <Users size={18} style={styles.navLinkIcon} />
              Équipes
            </NavLink>
          </nav>
        </div>

        {/* Main Content */}
        <main style={styles.mainContent}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div style={styles.header}>
                    <h1 style={styles.pageTitle}>Tableau de bord</h1>
                  </div>
                  <div style={styles.contentCard}>
                    <PublicMatchList />
                  </div>
                </>
              }
            />
            <Route
              path="/matches"
              element={
                <>
                  <div style={styles.header}>
                    <h1 style={styles.pageTitle}>Gestion des matchs</h1>
                  </div>
                  <div style={styles.contentCard}>
                    <MatchList />
                  </div>
                </>
              }
            />
            <Route
              path="/teams"
              element={
                <>
                  <div style={styles.header}>
                    <h1 style={styles.pageTitle}>Gestion des équipes</h1>
                  </div>
                  <div style={styles.contentCard}>
                    <TeamList />
                  </div>
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
