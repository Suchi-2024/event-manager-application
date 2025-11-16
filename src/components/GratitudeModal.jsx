// src/components/GratitudeModal.jsx
import React, { useState, useEffect } from "react";

export default function GratitudeModal({ show, taskText, onConfirm, onCancel }) {
  const [gratitude, setGratitude] = useState("");
  useEffect(() => {
    if (show) setGratitude("");
  }, [show]);

  if (!show) return null;
  return (
    <div style={{ position: "fixed", left: 0, right: 0, top: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, width: 420 }}>
        <h3 style={{ marginTop: 0 }}>Nice work!</h3>
        <div style={{ marginBottom: 12 }}>What are you grateful for about completing: <strong>{taskText}</strong>?</div>
        <textarea value={gratitude} onChange={(e) => setGratitude(e.target.value)} rows={4} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onCancel} style={{ padding: "8px 12px", borderRadius: 8 }}>Cancel</button>
          <button onClick={() => onConfirm(gratitude)} style={{ padding: "8px 12px", borderRadius: 8, background: "#667eea", color: "#fff", border: "none" }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
