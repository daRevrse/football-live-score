// ==================== ADMIN SETTINGS PAGE ====================
// front-admin/src/pages/admin/AdminSettings.js
import React, { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Shield,
  Bell,
  Database,
  Save,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { styles } from "./styles";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: "Football Manager",
      siteDescription: "Plateforme de gestion de football",
      defaultLanguage: "fr",
      timezone: "Europe/Paris",
    },
    security: {
      requireEmailVerification: true,
      passwordMinLength: 8,
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
    },
    notifications: {
      emailNotifications: true,
      matchReminders: true,
      systemAlerts: true,
      weeklyReports: false,
    },
    system: {
      backupFrequency: "daily",
      logLevel: "info",
      maintenanceMode: false,
      debugMode: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const handleSave = async (section) => {
    setLoading(true);
    setMessage("");

    try {
      // Simuler une sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage(`Paramètres ${section} sauvegardés avec succès`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: "general", label: "Général", icon: Globe },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "system", label: "Système", icon: Database },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Paramètres Système</h1>
        <p style={styles.subtitle}>Configuration de la plateforme</p>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            backgroundColor: message.includes("succès") ? "#d1fae5" : "#fee2e2",
            color: message.includes("succès") ? "#065f46" : "#dc2626",
          }}
        >
          {message.includes("succès") ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message}
        </div>
      )}

      <div style={styles.settingsContainer}>
        {/* Navigation des onglets */}
        <div style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.activeTab : {}),
                }}
              >
                <IconComponent size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu des onglets */}
        <div style={styles.tabContent}>
          {activeTab === "general" && (
            <div style={styles.settingsSection}>
              <h2 style={styles.sectionTitle}>Paramètres Généraux</h2>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Nom du site</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) =>
                    updateSetting("general", "siteName", e.target.value)
                  }
                  style={styles.settingInput}
                />
              </div>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Description</label>
                <textarea
                  value={settings.general.siteDescription}
                  onChange={(e) =>
                    updateSetting("general", "siteDescription", e.target.value)
                  }
                  style={styles.settingTextarea}
                  rows={3}
                />
              </div>

              <div style={styles.settingRow}>
                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>Langue par défaut</label>
                  <select
                    value={settings.general.defaultLanguage}
                    onChange={(e) =>
                      updateSetting(
                        "general",
                        "defaultLanguage",
                        e.target.value
                      )
                    }
                    style={styles.settingSelect}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>Fuseau horaire</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) =>
                      updateSetting("general", "timezone", e.target.value)
                    }
                    style={styles.settingSelect}
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleSave("general")}
                style={styles.saveButton}
                disabled={loading}
              >
                <Save size={16} />
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div style={styles.settingsSection}>
              <h2 style={styles.sectionTitle}>Paramètres de Sécurité</h2>

              <div style={styles.settingGroup}>
                <div style={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="emailVerification"
                    checked={settings.security.requireEmailVerification}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "requireEmailVerification",
                        e.target.checked
                      )
                    }
                    style={styles.checkbox}
                  />
                  <label
                    htmlFor="emailVerification"
                    style={styles.checkboxLabel}
                  >
                    Vérification email obligatoire
                  </label>
                </div>
              </div>

              <div style={styles.settingRow}>
                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>
                    Longueur minimale du mot de passe
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "passwordMinLength",
                        parseInt(e.target.value)
                      )
                    }
                    style={styles.settingInput}
                  />
                </div>

                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>
                    Timeout de session (secondes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    style={styles.settingInput}
                  />
                </div>
              </div>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>
                  Tentatives de connexion max
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) =>
                    updateSetting(
                      "security",
                      "maxLoginAttempts",
                      parseInt(e.target.value)
                    )
                  }
                  style={styles.settingInput}
                />
              </div>

              <button
                onClick={() => handleSave("security")}
                style={styles.saveButton}
                disabled={loading}
              >
                <Save size={16} />
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div style={styles.settingsSection}>
              <h2 style={styles.sectionTitle}>Paramètres de Notification</h2>

              <div style={styles.notificationSettings}>
                <div style={styles.settingGroup}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) =>
                        updateSetting(
                          "notifications",
                          "emailNotifications",
                          e.target.checked
                        )
                      }
                      style={styles.checkbox}
                    />
                    <label
                      htmlFor="emailNotifications"
                      style={styles.checkboxLabel}
                    >
                      Notifications par email
                    </label>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="matchReminders"
                      checked={settings.notifications.matchReminders}
                      onChange={(e) =>
                        updateSetting(
                          "notifications",
                          "matchReminders",
                          e.target.checked
                        )
                      }
                      style={styles.checkbox}
                    />
                    <label
                      htmlFor="matchReminders"
                      style={styles.checkboxLabel}
                    >
                      Rappels de matchs
                    </label>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="systemAlerts"
                      checked={settings.notifications.systemAlerts}
                      onChange={(e) =>
                        updateSetting(
                          "notifications",
                          "systemAlerts",
                          e.target.checked
                        )
                      }
                      style={styles.checkbox}
                    />
                    <label htmlFor="systemAlerts" style={styles.checkboxLabel}>
                      Alertes système
                    </label>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="weeklyReports"
                      checked={settings.notifications.weeklyReports}
                      onChange={(e) =>
                        updateSetting(
                          "notifications",
                          "weeklyReports",
                          e.target.checked
                        )
                      }
                      style={styles.checkbox}
                    />
                    <label htmlFor="weeklyReports" style={styles.checkboxLabel}>
                      Rapports hebdomadaires
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave("notifications")}
                style={styles.saveButton}
                disabled={loading}
              >
                <Save size={16} />
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}

          {activeTab === "system" && (
            <div style={styles.settingsSection}>
              <h2 style={styles.sectionTitle}>Paramètres Système</h2>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>
                  Fréquence de sauvegarde
                </label>
                <select
                  value={settings.system.backupFrequency}
                  onChange={(e) =>
                    updateSetting("system", "backupFrequency", e.target.value)
                  }
                  style={styles.settingSelect}
                >
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Niveau de log</label>
                <select
                  value={settings.system.logLevel}
                  onChange={(e) =>
                    updateSetting("system", "logLevel", e.target.value)
                  }
                  style={styles.settingSelect}
                >
                  <option value="error">Erreurs uniquement</option>
                  <option value="warn">Avertissements</option>
                  <option value="info">Informations</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div style={styles.dangerZone}>
                <h3 style={styles.dangerTitle}>Zone de Danger</h3>

                <div style={styles.settingGroup}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.system.maintenanceMode}
                      onChange={(e) =>
                        updateSetting(
                          "system",
                          "maintenanceMode",
                          e.target.checked
                        )
                      }
                      style={styles.checkbox}
                    />
                    <label
                      htmlFor="maintenanceMode"
                      style={styles.dangerCheckboxLabel}
                    >
                      Mode maintenance
                    </label>
                  </div>
                  <p style={styles.dangerDescription}>
                    Active le mode maintenance - les utilisateurs ne pourront
                    plus accéder au site
                  </p>
                </div>

                <div style={styles.settingGroup}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="debugMode"
                      checked={settings.system.debugMode}
                      onChange={(e) =>
                        updateSetting("system", "debugMode", e.target.checked)
                      }
                      style={styles.checkbox}
                    />
                    <label
                      htmlFor="debugMode"
                      style={styles.dangerCheckboxLabel}
                    >
                      Mode debug
                    </label>
                  </div>
                  <p style={styles.dangerDescription}>
                    Active les logs de debug - peut impacter les performances
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSave("system")}
                style={styles.saveButton}
                disabled={loading}
              >
                <Save size={16} />
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { AdminSettings };
