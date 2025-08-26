export const StatusBadge = ({ status, children }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case "success":
        return { backgroundColor: "#dcfce7", color: "#16a34a" };
      case "error":
        return { backgroundColor: "#fee2e2", color: "#dc2626" };
      case "warning":
        return { backgroundColor: "#fef3c7", color: "#92400e" };
      case "info":
        return { backgroundColor: "#dbeafe", color: "#3b82f6" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#6b7280" };
    }
  };

  return (
    <span
      style={{
        ...getStatusStyle(status),
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.025em",
      }}
    >
      {children}
    </span>
  );
};
