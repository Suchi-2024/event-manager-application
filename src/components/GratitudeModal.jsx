import React, { useState } from "react";

export default function GratitudeModal({
  show,
  onConfirm,
  onCancel,
  taskText,
}) {
  const [gratitude, setGratitude] = useState("");
  useEffect(() => {
  if (!show) {
    setGratitude("");
  }
  }, [show]);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.28)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 28,
          minWidth: 300,
          boxShadow: "0 4px 20px #0001",
          maxWidth: 450,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 12 }}>
          🎉 Please reflect: What are you grateful for after completing{" "}
          <i>{taskText}</i>?
        </div>
        <textarea
          style={{
            width: "100%",
            fontSize: 17,
            padding: 8,
            marginBottom: 10,
            minHeight: 58,
          }}
          placeholder="Type your gratitude here…"
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "6px 18px" }}>
            Cancel
          </button>
          <button
            style={{
              padding: "6px 18px",
              background: "#6cf",
              cursor: "pointer",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
            disabled={!gratitude.trim()}
            onClick={() => {
              onConfirm(gratitude.trim());
              setGratitude("");
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

