// src/components/TaskList.jsx
import React from "react";

/**
 * TaskList
 * - shows tasks
 * - controls visibility of action buttons based on task.status and available handlers
 * - displays priority badge and reminder
 * - displays gratitude text under completed tasks
 */

const priorityColor = {
  low: "#86efac", // soft green
  medium: "#67a5ff", // blue
  high: "#ff7b7b", // red
};

export default function TaskList({ tasks = [], onEdit, onDelete, onMarkOngoing, onMarkComplete }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {tasks.map((t) => {
        const isCompleted = t.status === "completed";
        const isOngoing = t.status === "ongoing";
        const cardStyle = {
          background: "#fff8e8",
          padding: 14,
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          transition: "transform 0.18s, opacity 0.25s, box-shadow 0.18s",
          opacity: isCompleted ? 0.65 : 1,
          transform: isCompleted ? "translateY(3px)" : "translateY(0)",
          filter: isCompleted ? "grayscale(6%)" : "none",
        };

        return (
          <div key={t.id} style={cardStyle}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "1.05em" }}>{t.text}</div>
                {/* priority badge */}
                {t.priority && (
                  <div
                    style={{
                      marginLeft: 8,
                      padding: "4px 8px",
                      borderRadius: 8,
                      fontSize: "0.75em",
                      fontWeight: 700,
                      color: "#1a202c",
                      background: priorityColor[t.priority] || priorityColor.medium,
                    }}
                  >
                    {t.priority.toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ fontSize: "0.9em", color: "#4a5568", marginTop: 6 }}>
                <span style={{ marginRight: 8 }}>📅 {t.due?.replace("T", ", ")}</span>
                {t.reminderMinutes != null && (
                  <span style={{ marginLeft: 4, color: "#2b6cb0", fontWeight: 600 }}>{t.reminderLabel || `${t.reminderMinutes}m before`}</span>
                )}
              </div>

              {/* status badge & gratitude */}
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <span style={{ background: "#ffd84d", padding: "4px 8px", borderRadius: 8, fontSize: "0.8em", fontWeight: 700 }}>
                  {t.status || "pending"}
                </span>
              </div>

              {/* show gratitude if completed */}
              {isCompleted && t.gratitude && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#f7fafc", color: "#2d3748", fontSize: "0.95em" }}>
                  <strong>Gratitude:</strong>
                  <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{t.gratitude}</div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Ongoing: show only if handler exists and task is pending */}
              {onMarkOngoing && t.status === "pending" && (
                <button
                  onClick={() => onMarkOngoing(t)}
                  title="Mark Ongoing"
                  style={{
                    background: "#3ecf8e",
                    border: "none",
                    padding: 8,
                    borderRadius: 8,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(62,207,142,0.12)",
                  }}
                >
                  ✔️
                </button>
              )}

              {/* Complete: show if not already completed and handler exists */}
              {onMarkComplete && t.status !== "completed" && (
                <button
                  onClick={() => onMarkComplete(t)}
                  title="Mark Complete"
                  style={{
                    background: "#34c3ff",
                    border: "none",
                    padding: 8,
                    borderRadius: 8,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(52,195,255,0.12)",
                  }}
                >
                  ✅
                </button>
              )}

              {/* Edit: show only if not completed */}
              {onEdit && t.status !== "completed" && (
                <button
                  onClick={() => onEdit(t)}
                  title="Edit"
                  style={{
                    background: "#f6ad55",
                    border: "none",
                    padding: 8,
                    borderRadius: 8,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(246,173,85,0.12)",
                  }}
                >
                  ✏️
                </button>
              )}

              {/* Delete always available when handler provided (including completed tasks) */}
              {onDelete && (
                <button
                  onClick={() => onDelete(t)}
                  title="Delete"
                  style={{
                    background: "#ff7b7b",
                    border: "none",
                    padding: 8,
                    borderRadius: 8,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(255,123,123,0.12)",
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
