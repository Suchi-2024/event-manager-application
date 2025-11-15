import React, { useState, useEffect } from "react";
import { TASK_STATUSES } from "../constants";

function getNowISOString() {
  return new Date().toISOString().slice(0, 16);
}

function calendarDay(dateString) {
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

  useEffect(() => {
    setText(editing ? editing.text : "");
    setDue(editing ? editing.due : getNowISOString());
    setStatus(editing ? editing.status : "pending");
    setError("");
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Task cannot be empty.");
      return;
    }

    if (isDuplicate(tasks, text, due, editing ? editing.id : undefined)) {
      setError("Duplicate task for this date already exists.");
      return;
    }

    // FIXED: More lenient time validation - allow tasks for today
    const dueDate = new Date(due);
    const now = new Date();
    
    // Only check if it's in the past by more than 1 minute (to account for processing time)
    if (dueDate.getTime() < now.getTime() - 60000) {
      setError("Due date/time cannot be in the past.");
      return;
    }

    if (editing) {
      onAdd({ ...editing, text: text.trim(), due, status });
      if (onCancelEdit) onCancelEdit();
    } else {
      onAdd({ text: text.trim(), due, status });
    }

    // Clear form
    setText("");
    setDue(getNowISOString());
    setStatus("pending");
    setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f8f9fa",
        padding: "16px",
        borderRadius: "12px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          style={{
            flex: "2 1 200px",
            padding: "10px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: "1em",
            outline: "none",
          }}
          type="text"
          placeholder="What do you want to do?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          disabled={readOnly || (!!editing && editing.status === "completed")}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#667eea";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        />
        <input
          style={{
            flex: "1.5 1 150px",
            padding: "10px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: "0.95em",
            outline: "none",
          }}
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          required
          disabled={readOnly || (!!editing && editing.status === "completed")}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#667eea";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            flex: "1 1 100px",
            padding: "10px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: "0.95em",
            outline: "none",
            cursor: "pointer",
          }}
          disabled={readOnly || (!!editing && editing.status === "completed")}
        >
          {TASK_STATUSES.filter((s) => s !== "completed").map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="submit"
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          disabled={readOnly || (!!editing && editing.status === "completed")}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {editing ? "💾 Save" : "➕ Add Task"}
        </button>
        
        {editing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              padding: "10px 20px",
              background: "#e2e8f0",
              color: "#4a5568",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
            disabled={readOnly}
          >
            ✖️ Cancel
          </button>
        )}
      </div>

                {error && (
        <div
          style={{
            color: "#e53e3e",
            marginTop: 10,
            fontSize: "0.9em",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
}


