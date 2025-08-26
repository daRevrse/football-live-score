// components/AssignReporter.js
import React, { useState, useEffect } from "react";
import { getReporters, assignReporterToMatch } from "../services/api";
import { User, X } from "lucide-react";
import { message } from "antd";

export default function AssignReporter({ match, onAssign }) {
  const [reporters, setReporters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [assignedReporter, setAssignedReporter] = useState(null);

  useEffect(() => {
    loadReporters();
  }, []);

  const loadReporters = async () => {
    try {
      const response = await getReporters();
      setReporters(response.data);
      if (match.reporterId) {
        const reporter = response.data.find((r) => r.id === match.reporterId);
        setAssignedReporter(reporter);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des reporters");
    }
  };

  const handleAssign = async (reporterId) => {
    try {
      setIsLoading(true);
      await assignReporterToMatch(match.id, reporterId);
      message.success("Reporter assigné avec succès");
      setShowDropdown(false);
      if (onAssign) onAssign();
    } catch (error) {
      message.error("Erreur lors de l'assignation du reporter");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async () => {
    try {
      setIsLoading(true);
      await assignReporterToMatch(match.id, null);
      message.success("Assignation supprimée");
      if (onAssign) onAssign();
    } catch (error) {
      message.error("Erreur lors de la suppression de l'assignation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          backgroundColor: match.reporterId ? "#7cfb8f40" : "#3b82f640",
          color: match.reporterId ? "#7cfb8f" : "#3b82f6",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "14px",
        }}
      >
        <User size={14} />
        {match.reporterId ? assignedReporter?.username : "Assigner reporter"}
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            bottom: "100%", // ancré en haut du bouton
            left: 0,
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 10,
            minWidth: "200px",
            marginBottom: "4px", // espace entre bouton et dropdown
          }}
        >
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: "500",
            }}
          >
            Choisir un reporter
          </div>

          {match.reporterId && (
            <button
              onClick={handleRemoveAssignment}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "8px 12px",
                textAlign: "left",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              <X size={14} />
              Retirer l'assignation
            </button>
          )}

          {reporters.map((reporter) => (
            <button
              key={reporter.id}
              onClick={() => handleAssign(reporter.id)}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "8px 12px",
                textAlign: "left",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              {reporter.username}
            </button>
          ))}
        </div>
      )}

      {showDropdown && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
