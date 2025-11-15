import React from "react";
import { TASK_STATUSES } from "../constants";

const statusColor = {
  pending: "#FFD700",
  ongoing: "#4191ff",
  completed: "#41d97b",
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
  return (
    <li
      style={{
        opacity: isCompleted ? 0.55 : 1,
        background: "#fff",
        marginBottom: 8,
        padding: 12,
        borderRadius: 7,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderLeft: `8px solid ${statusColor[task.status]}`,
      }}
    >
      <div>
        <span style={{ fontWeight: "bold" }}>{task.text}</span>
        <br />
        <span style={{ fontSize: 14, color: "#888" }}>
          📆 {new Date(task.due).toLocaleString()} | <b>Status:</b>{" "}
          <span style={{ color: statusColor[task.status] }}>
            {readable(task.status)}
          </span>
        </span>
        {isCompleted && (
          <div style={{ fontSize: 15, color: "#2da866", marginTop: 2 }}>
            <b>Gratitude:</b> <i>"{task.gratitude}"</i>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {isPending && (
          <button
            onClick={() => onMarkOngoing(task)}
            title="Mark as Ongoing"
            style={{ padding: "3px 9px" }}
          >
            ▶️
          </button>
        )}
        {(isOngoing || isPending) && (
          <button
            onClick={() => onMarkComplete(task)}
            title="Mark as Completed"
            style={{ padding: "3px 10px" }}
          >
            ✔️
          </button>
        )}
        {!isCompleted && (
          <button
            onClick={() => onEdit(task)}
            title="Edit"
            style={{ padding: "3px 9px" }}
          >
            ✏️
          </button>
        )}
        <button
          onClick={() => onDelete(task)}
          title="Delete"
          style={{ padding: "3px 9px" }}
        >
          🗑️
        </button>
      </div>
    </li>
  );
}
