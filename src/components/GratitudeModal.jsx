// src/components/GratitudeModal.jsx
import React, { useState, useEffect } from "react";

export default function GratitudeModal({ show, taskText, onConfirm, onCancel }) {
  const [gratitude, setGratitude] = useState("");
  useEffect(() => {
    if (show) setGratitude("");
  }, [show]);

  if (!show) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 }}>
      <div style={{ background: "#fff", width: "min(680px, 96%)", borderRadius: 12, padding: 20, boxShadow: "0 12px 40px rgba(2,6,23,0.4)" }}>
        <h3 style={{ marginTop: 0 }}>✨ Nice work!</h3>
        <div style={{ marginBottom: 10 }}>What are you grateful for about completing: <strong>{taskText}</strong>?</div>
        <textarea value={gratitude} onChange={(e) => setGratitude(e.target.value)} rows={6} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={onCancel} style={{ padding: "8px 12px", borderRadius: 8 }}>Cancel</button>
          <button onClick={() => onConfirm(gratitude)} style={{ padding: "8px 12px", borderRadius: 8, background: "#667eea", color: "#fff", border: "none" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
