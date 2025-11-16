// src/components/SessionSelector.jsx
import React, { useState } from "react";

/**
 * SessionSelector uses IST as the canonical date baseline.
 */

function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export default function SessionSelector({ selectedDate, onSelectDate }) {
  const [showHistory, setShowHistory] = useState(false);
  const todayStr = nowIST().toISOString().slice(0, 10);

  const getLast30Days = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = nowIST();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const getNext30Days = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const date = nowIST();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const last30Days = getLast30Days();
  const next30Days = getNext30Days();

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(102,126,234,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontWeight: 700, fontSize: "1.05em", color: "#2d3748" }}>📅 Session Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onSelectDate(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <button onClick={() => setShowHistory(!showHistory)} style={{ padding: "8px 14px", background: "#667eea", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          {showHistory ? "Hide" : "Show Calendar"}
        </button>
        {selectedDate > todayStr && <span style={{ background: "#eef2ff", color: "#3b82f6", padding: "6px 10px", borderRadius: 8 }}>📆 Future</span>}
        {selectedDate < todayStr && <span style={{ background: "#f1f5f9", color: "#64748b", padding: "6px 10px", borderRadius: 8 }}>📖 Past</span>}
      </div>

      {showHistory && (
        <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 10 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => { onSelectDate(todayStr); setShowHistory(false); }} style={{ padding: "8px 12px", background: "#2b6cb0", color: "#fff", border: "none", borderRadius: 8 }}>📍 Today</button>
            <button onClick={() => { const t = nowIST(); t.setDate(t.getDate()+1); onSelectDate(t.toISOString().slice(0,10)); setShowHistory(false); }} style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8 }}>➡ Tomorrow</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
            {next30Days.map((d) => (
              <button key={d} onClick={() => { onSelectDate(d); setShowHistory(false); }} style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", background: d === selectedDate ? "#667eea" : "#fff", color: d === selectedDate ? "#fff" : "#2d3748" }}>
                {d}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, fontWeight: 700 }}>Past 30 days</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginTop: 8 }}>
            {last30Days.map((d) => (
              <button key={d} onClick={() => { onSelectDate(d); setShowHistory(false); }} style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", background: d === selectedDate ? "#667eea" : "#fff", color: d === selectedDate ? "#fff" : "#2d3748" }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
