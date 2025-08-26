// front-admin/src/layouts/Sidebar.js
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Home,
  Settings,
  FileText,
  Shield,
  BarChart2,
  List,
  Award,
  Clipboard,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Flame,
  ShieldHalf,
  Volleyball,
  UserCheck,
  Trophy,
  Target,
  Edit,
  PlusCircle,
} from "lucide-react";
import { styles } from "./styles";
import UserSection from "./UserSection";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const [matchesMenuOpen, setMatchesMenuOpen] = useState(true);
  const [managerMenuOpen, setManagerMenuOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Menu pour les utilisateurs non connectés et Users
  const publicMenu = [
    {
      to: "/",
      icon: <Home size={18} style={styles.navLinkIcon} />,
      label: "Accueil",
      roles: ["User", "public"],
    },
    {
      key: "matches",
      to: "/matches",
      icon: <Calendar size={18} style={styles.navLinkIcon} />,
      label: "Matchs",
      roles: ["User", "public"],
      submenu: [
        {
          to: "/matches/live",
          icon: <Flame size={16} style={styles.navLinkIcon} />,
          label: "En direct",
        },
        {
          to: "/matches/upcoming",
          icon: <Clock size={16} style={styles.navLinkIcon} />,
          label: "À venir",
        },
        {
          to: "/matches/completed",
          icon: <CheckCircle size={16} style={styles.navLinkIcon} />,
          label: "Terminés",
        },
      ],
    },
    {
      to: "/teams",
      icon: <Shield size={18} style={styles.navLinkIcon} />,
      label: "Équipes",
      roles: ["User", "public"],
    },
  ];

  // Menu Manager
  const managerMenu = [
    {
      to: "/manager/dashboard",
      icon: <LayoutDashboard size={18} style={styles.navLinkIcon} />,
      label: "Tableau de Bord",
      roles: ["Manager"],
    },
    {
      key: "manager-section",
      icon: <UserCheck size={18} style={styles.navLinkIcon} />,
      label: "Gestion Équipe",
      roles: ["Manager"],
      submenu: [
        {
          to: "/manager/players",
          icon: <Users size={16} style={styles.navLinkIcon} />,
          label: "Effectif",
        },
        {
          to: "/manager/team/edit",
          icon: <Edit size={16} style={styles.navLinkIcon} />,
          label: "Infos Équipe",
        },
        {
          to: "/manager/stats",
          icon: <BarChart2 size={16} style={styles.navLinkIcon} />,
          label: "Statistiques",
        },
        {
          to: "/manager/matches",
          icon: <Trophy size={16} style={styles.navLinkIcon} />,
          label: "Historique Matchs",
        },
      ],
    },
  ];

  // Menu Reporter
  const reporterMenu = [
    {
      to: "/reporter/dashboard",
      icon: <LayoutDashboard size={18} style={styles.navLinkIcon} />,
      label: "Tableau de Bord",
      roles: ["Reporter"],
    },
    {
      to: "/reporter/matches",
      icon: <Clipboard size={18} style={styles.navLinkIcon} />,
      label: "Mes Matchs",
      roles: ["Reporter"],
    },
    {
      to: "/reporter/events",
      icon: <List size={18} style={styles.navLinkIcon} />,
      label: "Gestion Événements",
      roles: ["Reporter"],
    },
  ];

  // Menu Admin
  const adminMenu = [
    {
      to: "/admin/dashboard",
      icon: <LayoutDashboard size={18} style={styles.navLinkIcon} />,
      label: "Dashboard Admin",
      roles: ["Admin"],
    },
    {
      key: "admin-section",
      icon: <Shield size={18} style={styles.navLinkIcon} />,
      label: "Administration",
      roles: ["Admin"],
      submenu: [
        {
          to: "/admin/users",
          icon: <Users size={16} style={styles.navLinkIcon} />,
          label: "Utilisateurs",
        },
        {
          to: "/admin/teams",
          icon: <ShieldHalf size={16} style={styles.navLinkIcon} />,
          label: "Équipes",
        },
        {
          to: "/admin/matches",
          icon: <Calendar size={16} style={styles.navLinkIcon} />,
          label: "Matchs",
        },
        {
          to: "/admin/reports",
          icon: <FileText size={16} style={styles.navLinkIcon} />,
          label: "Rapports",
        },
        {
          to: "/admin/settings",
          icon: <Settings size={16} style={styles.navLinkIcon} />,
          label: "Paramètres",
        },
      ],
    },
  ];

  // Menu commun (visible pour tous les rôles connectés)
  const commonMenu = [
    {
      to: "/profile",
      icon: <UserCheck size={18} style={styles.navLinkIcon} />,
      label: "Mon Profil",
      roles: ["Admin", "Manager", "Reporter", "User"],
    },
  ];

  // Fonction pour obtenir les menus selon le rôle
  const getMenuItems = () => {
    if (!user) {
      // Utilisateur non connecté
      return publicMenu;
    }

    let menuItems = [];

    // Ajouter les menus spécifiques au rôle
    switch (user.role) {
      case "Admin":
        menuItems = [
          ...adminMenu,
          ...managerMenu, // Admin peut voir toutes les fonctionnalités
          ...reporterMenu,
          ...publicMenu,
          ...commonMenu,
        ];
        break;
      case "Manager":
        menuItems = [...managerMenu, ...publicMenu, ...commonMenu];
        break;
      case "Reporter":
        menuItems = [...reporterMenu, ...publicMenu, ...commonMenu];
        break;
      default:
        menuItems = [...publicMenu, ...commonMenu];
    }

    // Filtrer selon les rôles autorisés
    return menuItems.filter(
      (item) => item.roles.includes(user.role) || item.roles.includes("public")
    );
  };

  const toggleSubmenu = (menuKey) => {
    switch (menuKey) {
      case "matches":
        setMatchesMenuOpen(!matchesMenuOpen);
        break;
      case "manager-section":
        setManagerMenuOpen(!managerMenuOpen);
        break;
      case "admin-section":
        setAdminMenuOpen(!adminMenuOpen);
        break;
      default:
        break;
    }
  };

  const getSubmenuState = (menuKey) => {
    switch (menuKey) {
      case "matches":
        return matchesMenuOpen;
      case "manager-section":
        return managerMenuOpen;
      case "admin-section":
        return adminMenuOpen;
      default:
        return false;
    }
  };

  const renderMenuItem = (item) => {
    // Menu avec sous-menu
    if (item.submenu) {
      const menuKey = item.key || item.label.toLowerCase().replace(/\s+/g, "-");
      const isOpen = getSubmenuState(menuKey);

      return (
        <div key={item.key || item.to || item.label}>
          <div
            onClick={() => toggleSubmenu(menuKey)}
            style={{
              ...styles.navLink,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: isOpen ? "#f8fafc" : "transparent",
              color: isOpen ? "#3b82f6" : "#6b7280",
            }}
            onMouseEnter={(e) => {
              if (!isOpen) e.target.style.backgroundColor = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              if (!isOpen) e.target.style.backgroundColor = "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {item.icon}
              {item.label}
            </div>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {isOpen && (
            <div style={{ paddingLeft: "24px", marginTop: "4px" }}>
              {item.submenu.map((subItem) => (
                <NavLink
                  key={subItem.to}
                  to={subItem.to}
                  style={({ isActive }) => ({
                    ...styles.navLink,
                    ...(isActive && {
                      ...styles.navLinkActive,
                      backgroundColor: "#eff6ff",
                      borderLeft: "3px solid #3b82f6",
                    }),
                    padding: "8px 16px",
                    fontSize: "14px",
                    borderRadius: "6px",
                    margin: "2px 0",
                  })}
                >
                  {subItem.icon}
                  {subItem.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Menu normal sans sous-menu
    return (
      <NavLink
        key={item.to}
        to={item.to}
        style={({ isActive }) => ({
          ...styles.navLink,
          ...(isActive && {
            ...styles.navLinkActive,
            backgroundColor: "#eff6ff",
            borderLeft: "3px solid #3b82f6",
          }),
        })}
        onMouseEnter={(e) => {
          if (!e.target.style.backgroundColor.includes("rgb")) {
            e.target.style.backgroundColor = "#f9fafb";
          }
        }}
        onMouseLeave={(e) => {
          if (!e.target.style.backgroundColor.includes("239")) {
            e.target.style.backgroundColor = "transparent";
          }
        }}
      >
        {item.icon}
        {item.label}
      </NavLink>
    );
  };

  return (
    <div style={styles.sidebar}>
      <div>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <Volleyball size={18} />
          </div>
          <span style={styles.logoText}>TOGO G⚽AL</span>
        </div>

        {/* Badge de rôle */}
        {user && (
          <div
            style={{
              margin: "0 24px 16px",
              padding: "8px 12px",
              backgroundColor:
                user.role === "Admin"
                  ? "#fef2f2"
                  : user.role === "Manager"
                  ? "#f0f9ff"
                  : user.role === "Reporter"
                  ? "#f0fdf4"
                  : "#f9fafb",
              color:
                user.role === "Admin"
                  ? "#dc2626"
                  : user.role === "Manager"
                  ? "#0369a1"
                  : user.role === "Reporter"
                  ? "#16a34a"
                  : "#6b7280",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {user.role}
            {user.teamId && (
              <div style={{ fontSize: "10px", marginTop: "2px", opacity: 0.8 }}>
                Équipe: {user.managedTeam?.name || `ID ${user.teamId}`}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav style={styles.nav}>
          {getMenuItems().map((item) => renderMenuItem(item))}
        </nav>

        {/* Actions rapides pour Manager */}
        {user?.role === "Manager" && (
          <div style={{ padding: "16px", marginTop: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#6b7280",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Actions Rapides
            </div>
            <NavLink
              to="/manager/players"
              style={{
                ...styles.navLink,
                backgroundColor: "#f0f9ff",
                color: "#0369a1",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                border: "1px solid #e0f2fe",
              }}
            >
              <PlusCircle size={16} />
              Ajouter un joueur
            </NavLink>
          </div>
        )}
      </div>

      {/* Section utilisateur */}
      <UserSection />
    </div>
  );
};

export default Sidebar;
