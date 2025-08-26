export const MetricCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  trendDirection = "up",
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {Icon && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            color: "#3b82f6",
            padding: "12px",
            borderRadius: "10px",
            marginRight: "16px",
          }}
        >
          <Icon size={24} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#111827",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            {subtitle}
          </div>
        )}
        {trend && (
          <div
            style={{
              fontSize: "12px",
              color: trendDirection === "up" ? "#16a34a" : "#dc2626",
              marginTop: "4px",
            }}
          >
            {trendDirection === "up" ? "↗" : "↘"} {trend}
          </div>
        )}
      </div>
    </div>
  );
};
