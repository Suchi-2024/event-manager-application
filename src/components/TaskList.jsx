// src/components/TaskList.jsx
import React from "react";

const priorityColor = {
  low: "#bbf7d0",
  medium: "#bfdbfe",
  high: "#fecaca",
};

export default function TaskList({
  tasks = [],
  onEdit,
  onDelete,
  onMarkOngoing,
  onMarkComplete,
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {tasks.map((t) => {
        const isCompleted = t.status === "completed";

        return (
          <div
            key={t.id}
            style={{
              background: "#fff8e8",
              padding: 14,
              borderRadius: 10,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
              transition: "all 0.2s ease",
              opacity: isCompleted ? 0.85 : 1,
            }}
          >
            {/* LEFT SIDE */}
            <div style={{ flex: 1 }}>
              {/* Title + Priority */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "1.05em" }}>
                  {t.text}
                </div>

                {t.priority && (
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      background:
                        priorityColor[t.priority] || priorityColor.medium,
                      fontWeight: 700,
                      fontSize: "0.75em",
                    }}
                  >
                    {t.priority.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Due Time + Reminder */}
              <div
                style={{
                  marginTop: 6,
                  color: "#475569",
                  fontSize: "0.9em",
                }}
              >
                <span>🕒 {t.due?.replace("T", ", ")}</span>

                {t.reminderValue != null && t.reminderUnit && (
                  <span
                    style={{
                      marginLeft: 10,
                      color: "#1e40af",
                      fontWeight: 600,
                    }}
                  >
                    🔔 {t.reminderValue} {t.reminderUnit} before
                  </span>
                )}
              </div>

              {/* Status */}
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    background: "#fff5b1",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  {t.status || "pending"}
                </span>
              </div>

              {/* Completed Extra Details */}
              {isCompleted && (t.gratitude || t.reflectionFeedback) && (
                <div
                  style={{
                    marginTop: 10,
                    background: "#f8fafc",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {t.gratitude && (
                    <div>
                      <strong>💬 Gratitude:</strong>
                      <div
                        style={{
                          marginTop: 6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {t.gratitude}
                      </div>
                    </div>
                  )}

                  {t.reflectionFeedback && (
                    <div style={{ marginTop: 12 }}>
                      <strong>✨ AI Reflection:</strong>
                      <div
                        style={{
                          marginTop: 6,
                          whiteSpace: "pre-wrap",
                          color: "#0f172a",
                        }}
                      >
                        {t.reflectionFeedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT BUTTON COLUMN */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Mark Ongoing */}
              {onMarkOngoing && t.status === "pending" && (
                <button
                  onClick={() => onMarkOngoing(t)}
                  title="Mark Ongoing"
                  style={{
                    background: "#34d399",
                    borderRadius: 8,
                    padding: 8,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✔️
                </button>
              )}

              {/* Mark Complete */}
              {onMarkComplete && !isCompleted && (
                <button
                  onClick={() => onMarkComplete(t)}
                  title="Mark Complete"
                  style={{
                    background: "#60a5fa",
                    borderRadius: 8,
                    padding: 8,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✅
                </button>
              )}

              {/* Edit */}
              {onEdit && !isCompleted && (
                <button
                  onClick={() => onEdit(t)}
                  title="Edit"
                  style={{
                    background: "#f6ad55",
                    borderRadius: 8,
                    padding: 8,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✏️
                </button>
              )}

              {/* DELETE ALWAYS WORKS */}
              {onDelete && (
                <button
                  onClick={() => onDelete(t)}
                  title="Delete"
                  style={{
                    background: "#fb7185",
                    borderRadius: 8,
                    padding: 8,
                    border: "none",
                    cursor: "pointer",
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
