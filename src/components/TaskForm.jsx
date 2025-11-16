import React, { useState, useEffect } from "react";
import { TASK_STATUSES, TASK_PRIORITIES, PRIORITY_COLORS, PRIORITY_LABELS, REMINDER_SETTINGS } from "../constants";

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
  const [priority, setPriority] = useState(editing ? editing.priority : TASK_PRIORITIES.MEDIUM);
  const [reminder, setReminder] = useState(editing ? editing.reminder : "1day");
  const [error, setError] = useState("");

  useEffect(() => {
    setText(editing ? editing.text : "");
    setDue(editing ? editing.due : getNowISOString());
    setStatus(editing ? editing.status : "pending");
    setPriority(editing ? editing.priority : TASK_PRIORITIES.MEDIUM);
    setReminder(editing ? editing.reminder : "1day");
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

    const dueDate = new Date(due);
    const now = new Date();

    if (dueDate.getTime() < now.getTime() - 60000) {
      setError("Due date/time cannot be in the past.");
      return;
    }

    if (editing) {
      onAdd({ ...editing, text: text.trim(), due, status, priority, reminder });
      if (onCancelEdit) onCancelEdit();
    } else {
      onAdd({ 
        text: text.trim(), 
        due, 
        status, 
        priority,
        reminder,
        reminderSent: false
      });
    }

    setText("");
    setDue(getNowISOString());
    setStatus("pending");
    setPriority(TASK_PRIORITIES.MEDIUM);
    setReminder("1day");
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
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            flex: "1 1 120px",
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

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{
            flex: "1 1 120px",
            padding: "10px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: "0.95em",
            outline: "none",
            cursor: "pointer",
            background: `linear-gradient(90deg, ${PRIORITY_COLORS[priority]}15 0%, transparent 100%)`,
            fontWeight: 600,
            color: PRIORITY_COLORS[priority],
          }}
          disabled={readOnly || (!!editing && editing.status === "completed")}
        >
          {Object.entries(TASK_PRIORITIES).map(([key, value]) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]} Priority
            </option>
          ))}
        </select>

        <select
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          style={{
            flex: "1 1 150px",
            padding: "10px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: "0.95em",
            outline: "none",
            cursor: "pointer",
          }}
          disabled={readOnly || (!!editing && editing.status === "completed")}
        >
          <option value="">No reminder</option>
          {Object.entries(REMINDER_SETTINGS).map(([key, value]) => (
            <option key={key} value={key}>
              🔔 {value.label}
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
            marginTop: 12,
            padding: "10px 14px",
            background: "#fff5f5",
            border: "2px solid #fc8181",
            borderRadius: 8,
            color: "#c53030",
            fontSize: "0.9em",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
