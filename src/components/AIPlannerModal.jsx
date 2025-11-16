export default function AIPlannerModal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 10,
          width: "90%",
          maxWidth: 600,
        }}
      >
        <h2>✨ Your AI-Generated Daily Plan</h2>
        <div style={{ marginTop: 10 }}>{children}</div>

        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: "8px 20px",
            background: "#444",
            color: "white",
            borderRadius: 6,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
