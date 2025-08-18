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
} from "lucide-react";
import { styles } from "./styles";
import UserSection from "./UserSection";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const [matchesMenuOpen, setMatchesMenuOpen] = useState(true);

  // Menu de base accessible à tous
  const commonMenu = [
    {
      to: "/",
      icon:
        user.role === "User" ? (
          <Calendar size={18} style={styles.navLinkIcon} />
        ) : (
          <Home size={18} style={styles.navLinkIcon} />
        ),
      label: user.role === "User" ? "Matches" : "Accueil",
      roles: ["Admin", "Reporter", "User"],
      submenu:
        user.role === "User"
          ? [
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
            ]
          : null,
    },
    {
      to: "/matches",
      icon: <Calendar size={18} style={styles.navLinkIcon} />,
      label: "Matchs",
      roles: ["Admin", "Reporter"],
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
      icon: <Users size={18} style={styles.navLinkIcon} />,
      label: "Équipes",
      roles: ["Admin", "Reporter"],
    },
    {
      to: "/stats",
      icon: <BarChart2 size={18} style={styles.navLinkIcon} />,
      label: "Statistiques",
      roles: ["Admin", "Reporter"],
    },
  ];

  // Menu Admin
  const adminMenu = [
    {
      to: "/admin/users",
      icon: <Shield size={18} style={styles.navLinkIcon} />,
      label: "Gestion Utilisateurs",
      roles: ["Admin"],
    },
    {
      to: "/admin/settings",
      icon: <Settings size={18} style={styles.navLinkIcon} />,
      label: "Paramètres",
      roles: ["Admin"],
    },
    {
      to: "/admin/reports",
      icon: <FileText size={18} style={styles.navLinkIcon} />,
      label: "Rapports",
      roles: ["Admin"],
    },
  ];

  // Menu Reporter
  const reporterMenu = [
    {
      to: "/reporter/matches",
      icon: <Clipboard size={18} style={styles.navLinkIcon} />,
      label: "Gestion Matchs",
      roles: ["Reporter", "Admin"],
    },
    {
      to: "/reporter/events",
      icon: <List size={18} style={styles.navLinkIcon} />,
      label: "Événements",
      roles: ["Reporter", "Admin"],
    },
  ];

  // Menu User
  const userMenu = [];

  // Fusionner les menus selon le rôle
  const getMenuItems = () => {
    if (!user) return [];

    const allMenus = [...commonMenu];

    if (user.role === "Admin") {
      allMenus.push(...adminMenu, ...reporterMenu);
    } else if (user.role === "Reporter") {
      allMenus.push(...reporterMenu);
    } else {
      allMenus.push(...userMenu);
    }

    return allMenus.filter((item) => item.roles.includes(user?.role));
  };
  const toggleMatchesMenu = () => {
    setMatchesMenuOpen(!matchesMenuOpen);
  };

  const renderMenuItem = (item) => {
    if (item.submenu) {
      return (
        <div key={item.label}>
          <div
            onClick={toggleMatchesMenu}
            style={{
              ...styles.navLink,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {item.icon}
              {item.label}
            </div>
            {matchesMenuOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>

          {matchesMenuOpen && (
            <div style={{ paddingLeft: "24px" }}>
              {item.submenu.map((subItem) => (
                <NavLink
                  key={subItem.to}
                  to={subItem.to}
                  style={({ isActive }) => ({
                    ...styles.navLink,
                    ...(isActive && styles.navLinkActive),
                    padding: "8px 16px",
                    fontSize: "14px",
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

    return (
      <NavLink
        key={item.to}
        to={item.to}
        style={({ isActive }) => ({
          ...styles.navLink,
          ...(isActive && styles.navLinkActive),
        })}
      >
        {item.icon}
        {item.label}
      </NavLink>
    );
  };

  return (
    <div style={styles.sidebar}>
      <div>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <LayoutDashboard size={18} />
          </div>
          <span style={styles.logoText}>SportDashboard</span>
        </div>

        <nav style={styles.nav}>
          {getMenuItems().map((item) => renderMenuItem(item))}
        </nav>
      </div>

      <UserSection />
    </div>
  );
};

export default Sidebar;
