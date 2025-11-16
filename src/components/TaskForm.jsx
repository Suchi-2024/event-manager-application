// src/components/TaskForm.jsx
import React, { useEffect, useState } from "react";

export default function TaskForm({ onAdd, tasks = [], editing, onCancelEdit }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState(() => {
    // default to next hour rounded
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (editing) {
      setText(editing.text || "");
      setDue(editing.due || new Date().toISOString().slice(0, 16));
      setPriority(editing.priority || "medium");
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return alert("Enter a task");

    // Prevent past date/time submission
    const now = new Date();
    const selected = new Date(due);

    if (selected < now) {
      return alert("You cannot add a task in the past. Please choose a future time.");
    }

    const payload = {
      id: editing?.id,
      text: text.trim(),
      due,
      priority,
      status: editing?.status || "pending",
    };

    onAdd(payload);

    if (!editing) {
      setText("");
      // keep date for quick multiple adds
    } else {
      onCancelEdit();
    }
  };

  // min property prevents selection of past datetime in browsers that support it
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 18, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to do?" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <input type="datetime-local" value={due} min={minDateTime} onChange={(e) => setDue(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8 }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" style={{ background: "#667eea", color: "#fff", borderRadius: 8, padding: "10px 14px", border: "none", cursor: "pointer" }}>
          {editing ? "Save" : "Add Task"}
        </button>
      </div>

      {editing && (
        <div>
          <button type="button" onClick={onCancelEdit} style={{ background: "#e2e8f0", borderRadius: 8, padding: "8px 12px", border: "none", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
