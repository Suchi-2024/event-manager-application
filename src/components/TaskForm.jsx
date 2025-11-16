// src/components/TaskForm.jsx
import React, { useEffect, useState } from "react";

/**
 * TaskForm:
 * - due (datetime-local) uses min according to IST
 * - reminder uses numeric + unit (minutes/hours/days)
 */

function nowISTForInput() {
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  // format to yyyy-mm-ddTHH:MM
  const y = nowIST.getFullYear();
  const m = String(nowIST.getMonth() + 1).padStart(2, "0");
  const d = String(nowIST.getDate()).padStart(2, "0");
  const hh = String(nowIST.getHours()).padStart(2, "0");
  const mm = String(nowIST.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export default function TaskForm({ onAdd, tasks = [], editing, onCancelEdit }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [priority, setPriority] = useState("medium");

  // reminder numeric + unit
  const [reminderValue, setReminderValue] = useState("");
  const [reminderUnit, setReminderUnit] = useState("minutes");

  useEffect(() => {
    if (editing) {
      setText(editing.text || "");
      setDue(editing.due || new Date().toISOString().slice(0, 16));
      setPriority(editing.priority || "medium");
      setReminderValue(editing.reminderValue ?? "");
      setReminderUnit(editing.reminderUnit ?? "minutes");
    }
  }, [editing]);

  const minDateTime = nowISTForInput();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return alert("Enter a task");

    // IST validation
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const selected = new Date(due);
    if (selected.getTime() < nowIST.getTime()) {
      return alert("You cannot add a task in the past (IST). Please choose a future time.");
    }

    const payload = {
      id: editing?.id,
      text: text.trim(),
      due,
      priority,
      status: editing?.status || "pending",
      reminderValue: reminderValue ? Number(reminderValue) : null,
      reminderUnit: reminderValue ? reminderUnit : null,
    };

    onAdd(payload);
    if (!editing) {
      setText("");
      // keep due to allow batch adding
    } else {
      onCancelEdit();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to do?" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} />

        <input type="datetime-local" value={due} min={minDateTime} onChange={(e) => setDue(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", width: 220 }} />

        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8 }}>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>

        <button type="submit" style={{ background: "#667eea", color: "#fff", padding: "10px 14px", borderRadius: 8, border: "none" }}>{editing ? "Save" : "Add Task"}</button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontWeight: 700 }}>🔔 Reminder:</label>
        <input type="number" min={1} value={reminderValue} onChange={(e) => setReminderValue(e.target.value.replace(/[^\d]/g, ""))} placeholder="Amount" style={{ width: 100, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <select value={reminderUnit} onChange={(e) => setReminderUnit(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="minutes">minutes</option>
          <option value="hours">hours</option>
          <option value="days">days</option>
        </select>

        <div style={{ marginLeft: "auto", color: "#64748b" }}>
          {reminderValue ? `Will remind ${reminderValue} ${reminderUnit} before` : "No reminder"}
        </div>
      </div>
    </form>
  );
}
