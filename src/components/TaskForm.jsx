import React, { useState, useEffect } from "react";
import { TASK_STATUSES } from "../constants";

function getNowISOString() {
  return new Date().toISOString().slice(0, 16);
}
function calendarDay(dateString) {
  // Only YYYY-MM-DD part
  return dateString?.split("T")[0] || "";
}
function isDuplicate(tasks, text, due, ignoreId) {
  if (!text || !due) return false;
  const testText = text.trim().toLowerCase();
  const testDay = calendarDay(due);
  return tasks.some(
    (t) =>
      t.id !== ignoreId &&
      t.text.trim().toLowerCase() === testText &&
      calendarDay(t.due) === testDay
  );
}

export default function TaskForm({
  onAdd,
  tasks,
  editing,
  onCancelEdit,
  readOnly = false,
}) {
  const [text, setText] = useState(editing ? editing.text : "");
  const [due, setDue] = useState(editing ? editing.due : getNowISOString());
  const [status, setStatus] = useState(editing ? editing.status : "pending");
  const [error, setError] = useState("");

  // If editing changes (e.g. switching between tasks), update local state
  useEffect(() => {
    setText(editing ? editing.text : "");
    setDue(editing ? editing.due : getNowISOString());
    setStatus(editing ? editing.status : "pending");
    setError("");
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!text.trim()) return setError("Task cannot be empty.");
    if (isDuplicate(tasks, text, due, editing ? editing.id : undefined))
      return setError("Duplicate task for this date already exists.");

    if (new Date(due) < new Date())
      return setError("Due date/time must not be in the past.");

    if (editing) {
      onAdd({ ...editing, text: text.trim(), due, status });
      if (onCancelEdit) onCancelEdit();
    } else {
      onAdd({ text: text.trim(), due, status, links: [], gratitude: "" });
    }
    setText("");
    setDue(getNowISOString());
    setStatus("pending");
    setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}
    >
      <input
        style={{ flex: "2 1 120px", padding: 6 }}
        type="text"
        placeholder="Task…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        disabled={readOnly || (!!editing && editing.status === "completed")}
      />
      <input
        style={{ flex: "2 1 120px", padding: 6 }}
        type="datetime-local"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        required
        disabled={readOnly || (!!editing && editing.status === "completed")}
        min={getNowISOString()}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ flex: "1 1 80px", padding: 6 }}
        disabled={readOnly || (!!editing && editing.status === "completed")}
      >
        {TASK_STATUSES.filter((s) => s !== "completed").map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        style={{ padding: "7px 16px" }}
        disabled={readOnly || (!!editing && editing.status === "completed")}
      >
        {editing ? "Save" : "Add"}
      </button>
      {editing && onCancelEdit && (
        <button
          type="button"
          onClick={onCancelEdit}
          style={{ padding: "7px 14px" }}
          disabled={readOnly}
        >
          Cancel
        </button>
      )}
      {error && <span style={{ color: "red", width: "100%" }}>{error}</span>}
    </form>
  );
}
