export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel = "Action",
}) => {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "#6b7280",
      }}
    >
      {Icon && (
        <Icon size={48} style={{ marginBottom: "16px", color: "#9ca3af" }} />
      )}
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          color: "#374151",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      {description && <p style={{ marginBottom: "24px" }}>{description}</p>}
      {action && (
        <button
          onClick={action}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
