// src/components/TaskForm.jsx
import React, { useEffect, useState } from "react";

/**
 * TaskForm
 * - presets + custom reminder
 * - IST-based min datetime
 */

export default function TaskForm({ onAdd, tasks = [], editing, onCancelEdit }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState(() => {
    // default to next hour rounded (in user's local time)
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [priority, setPriority] = useState("medium");

  // Reminders: store minutes number and label
  const [reminderMinutes, setReminderMinutes] = useState(null);
  const [reminderLabel, setReminderLabel] = useState("");

  // custom minutes text input
  const [customMinutes, setCustomMinutes] = useState("");

  useEffect(() => {
    if (editing) {
      setText(editing.text || "");
      setDue(editing.due || new Date().toISOString().slice(0, 16));
      setPriority(editing.priority || "medium");
      setReminderMinutes(editing.reminderMinutes ?? null);
      setReminderLabel(editing.reminderLabel || "");
      setCustomMinutes(editing.reminderMinutes ? String(editing.reminderMinutes) : "");
    }
  }, [editing]);

  // IST now for min attribute
  function getISTNowForInput() {
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    // But datetime-local expects local representation. We will use the instant from IST and format
    const y = nowIST.getFullYear();
    const m = String(nowIST.getMonth() + 1).padStart(2, "0");
    const d = String(nowIST.getDate()).padStart(2, "0");
    const hh = String(nowIST.getHours()).padStart(2, "0");
    const mm = String(nowIST.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}`;
  }

  const minDateTime = getISTNowForInput();

  const presetOptions = [
    { label: "No reminder", minutes: null },
    { label: "5 minutes before", minutes: 5 },
    { label: "10 minutes before", minutes: 10 },
    { label: "30 minutes before", minutes: 30 },
    { label: "1 hour before", minutes: 60 },
    { label: "2 hours before", minutes: 120 },
    { label: "1 day before", minutes: 1440 },
  ];

  const handlePresetChange = (e) => {
    const v = e.target.value;
    if (!v) {
      setReminderMinutes(null);
      setReminderLabel("");
      setCustomMinutes("");
      return;
    }
    const minutes = Number(v);
    setReminderMinutes(minutes);
    setReminderLabel(minutes >= 60 ? (minutes === 1440 ? "1 day before" : `${minutes / 60} hour(s) before`) : `${minutes} minutes before`);
    setCustomMinutes(String(minutes));
  };

  const handleCustomApply = () => {
    const n = Number(customMinutes);
    if (!n || n <= 0) return alert("Enter a positive number of minutes for custom reminder.");
    setReminderMinutes(n);
    setReminderLabel(`${n} minutes before`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return alert("Enter a task");

    // Prevent past date/time submission (IST-based)
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const selected = new Date(due); // user-supplied local datetime instant
    // convert selected to instant and compare with IST instant
    if (selected.getTime() < nowIST.getTime()) {
      return alert("You cannot add a task in the past (IST). Please choose a future time.");
    }

    const payload = {
      id: editing?.id,
      text: text.trim(),
      due,
      priority,
      status: editing?.status || "pending",
      reminderMinutes,
      reminderLabel,
    };

    onAdd(payload);

    if (!editing) {
      setText("");
      // keep other fields (makes adding multiple easier)
    } else {
      onCancelEdit();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 18, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you want to do?"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}
        />

        <input
          type="datetime-local"
          value={due}
          min={minDateTime}
          onChange={(e) => setDue(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", width: 220 }}
        />

        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8 }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button type="submit" style={{ background: "#667eea", color: "#fff", borderRadius: 8, padding: "10px 14px", border: "none", cursor: "pointer" }}>
          {editing ? "Save" : "Add Task"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <label style={{ fontSize: "0.9em", color: "#4a5568", fontWeight: 600 }}>Reminder:</label>
        <select onChange={handlePresetChange} value={reminderMinutes ?? ""} style={{ padding: "8px 10px", borderRadius: 8 }}>
          {presetOptions.map((o) => (
            <option key={String(o.minutes)} value={o.minutes ?? ""}>
              {o.label}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            placeholder="Custom minutes"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value.replace(/[^\d]/g, ""))}
            style={{ padding: "8px 10px", borderRadius: 8, width: 110, border: "1px solid #e2e8f0" }}
          />
          <button type="button" onClick={handleCustomApply} style={{ padding: "8px 10px", borderRadius: 8, background: "#e2e8f0", border: "none", cursor: "pointer" }}>
            Apply
          </button>
        </div>

        <div style={{ marginLeft: "auto", color: "#718096", fontSize: "0.9em" }}>
          {reminderMinutes ? <span>Will remind: {reminderLabel || `${reminderMinutes}m before`}</span> : <span>No reminder</span>}
        </div>
      </div>

      {editing && (
        <div>
          <button type="button" onClick={onCancelEdit} style={{ background: "#e2e8f0", borderRadius: 8, padding: "8px 12px", border: "none", cursor: "pointer", marginTop: 8 }}>
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
