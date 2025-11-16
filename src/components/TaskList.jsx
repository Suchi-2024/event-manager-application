// src/components/TaskList.jsx
import React from "react";

export default function TaskList({ tasks = [], onEdit, onDelete, onMarkOngoing, onMarkComplete }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {tasks.map((t) => (
        <div key={t.id} style={{ background: "#fff8e8", padding: 14, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{t.text}</div>
            <div style={{ fontSize: "0.9em", color: "#4a5568" }}>
              📅 {t.due?.replace("T", ", ")} {t.reminder ? " 🔔 Reminder set" : ""}
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: "#ffd84d", padding: "4px 8px", borderRadius: 8, fontSize: "0.8em" }}>{t.status || "pending"}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {onMarkOngoing && (
              <button onClick={() => onMarkOngoing(t)} title="Mark Ongoing" style={{ background: "#3ecf8e", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" }}>
                ✔️
              </button>
            )}
            {onMarkComplete && (
              <button onClick={() => onMarkComplete(t)} title="Mark Complete" style={{ background: "#34c3ff", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" }}>
                ✅
              </button>
            )}
            {onEdit && (
              <button onClick={() => onEdit(t)} title="Edit" style={{ background: "#f6ad55", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" }}>
                ✏️
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(t)} title="Delete" style={{ background: "#ff7b7b", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" }}>
                🗑️
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
