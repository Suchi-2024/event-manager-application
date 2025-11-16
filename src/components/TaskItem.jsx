import React from "react";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../constants";

const statusColor = {
  pending: "#FFD700",
  ongoing: "#4191ff",
  completed: "#41d97b",
};

const statusBg = {
  pending: "#fffbeb",
  ongoing: "#eff6ff",
  completed: "#f0fdf4",
};

const readable = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function TaskItem({
  task,
  onEdit,
  onDelete,
  onMarkOngoing,
  onMarkComplete,
}) {
  const isCompleted = task.status === "completed";
  const isOngoing = task.status === "ongoing";
  const isPending = task.status === "pending";
  const priority = task.priority || "medium";

  return (
    <li
      style={{
        opacity: isCompleted ? 0.75 : 1,
        background: statusBg[task.status],
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderLeft: `5px solid ${PRIORITY_COLORS[priority]}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        position: "relative",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Priority Badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          padding: "4px 10px",
          background: PRIORITY_COLORS[priority],
          color: "#fff",
          borderRadius: 6,
          fontSize: "0.75em",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {PRIORITY_LABELS[priority]}
      </div>

      <div style={{ flex: 1, paddingRight: 80 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "1.05em",
            color: "#2d3748",
            marginBottom: 6,
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {task.text}
        </div>
        <div style={{ fontSize: "0.9em", color: "#718096", marginBottom: 4 }}>
          📅 {new Date(task.due).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {task.reminder && (
            <span style={{ marginLeft: 12, color: "#667eea" }}>
              🔔 Reminder set
            </span>
          )}
        </div>
        <div style={{ display: "inline-block" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              background: statusColor[task.status],
              color: "#fff",
              borderRadius: 6,
              fontSize: "0.85em",
              fontWeight: 600,
            }}
          >
            {readable(task.status)}
          </span>
        </div>
        {isCompleted && task.gratitude && (
          <div
            style={{
              fontSize: "0.95em",
              color: "#2da866",
              marginTop: 8,
              fontStyle: "italic",
              padding: "8px 12px",
              background: "#f0fdf4",
              borderRadius: 8,
              borderLeft: "3px solid #41d97b",
            }}
          >
            <strong>🙏 Gratitude:</strong> "{task.gratitude}"
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
        {isPending && onMarkOngoing && (
          <button
            onClick={() => onMarkOngoing(task)}
            title="Mark as Ongoing"
            style={{
              padding: "8px 12px",
              background: "#4191ff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "1.1em",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ▶️
          </button>
        )}
        {(isOngoing || isPending) && onMarkComplete && (
          <button
            onClick={() => onMarkComplete(task)}
            title="Mark as Completed"
            style={{
              padding: "8px 12px",
              background: "#41d97b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "1.1em",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ✔️
          </button>
        )}
        {!isCompleted && onEdit && (
          <button
            onClick={() => onEdit(task)}
            title="Edit"
            style={{
              padding: "8px 12px",
              background: "#a0aec0",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "1.1em",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task)}
            title="Delete"
            style={{
              padding: "8px 12px",
              background: "#fc8181",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "1.1em",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  );
}
