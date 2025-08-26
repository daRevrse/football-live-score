export const LoadingSpinner = ({ size = "medium", color = "#3b82f6" }) => {
  const sizes = {
    small: "16px",
    medium: "24px",
    large: "32px",
  };

  return (
    <div
      style={{
        width: sizes[size],
        height: sizes[size],
        border: `2px solid #f3f4f6`,
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
  );
};
