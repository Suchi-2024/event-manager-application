// src/components/SessionSelector.jsx
import React, { useState } from "react";

export default function SessionSelector({ selectedDate, onSelectDate }) {
  const [showHistory, setShowHistory] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);

  const getLast30Days = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const getNext30Days = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const last30Days = getLast30Days();
  const next30Days = getNext30Days();

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(102, 126, 234, 0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
        <label style={{ fontWeight: 700, fontSize: "1.1em", color: "#2d3748" }}>📅 Session Date:</label>
        <input
          type="date"
          value={selectedDate}
          style={{ fontSize: "1em", border: "2px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", background: "#fff", fontWeight: 500, color: "#2d3748", cursor: "pointer", transition: "all 0.2s" }}
          onChange={(e) => { onSelectDate(e.target.value); }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#667eea"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <button onClick={() => setShowHistory(!showHistory)} style={{ padding: "10px 18px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.95em" }}>
          {showHistory ? "📅 Hide Calendar" : "📅 Show Calendar"}
        </button>

        {selectedDate > todayStr && <span style={{ color: "#667eea", fontSize: "0.95em", fontWeight: 600, background: "#eff6ff", padding: "6px 12px", borderRadius: 8 }}>📆 Future session</span>}
        {selectedDate < todayStr && <span style={{ color: "#718096", fontSize: "0.95em", fontStyle: "italic", background: "#edf2f7", padding: "6px 12px", borderRadius: 8 }}>📖 Past session - read only</span>}
      </div>

      {showHistory && (
        <div style={{ marginTop: 20, background: "#f7fafc", borderRadius: 12, padding: 16, maxHeight: 400, overflowY: "auto", border: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => { onSelectDate(todayStr); setShowHistory(false); }} style={{ padding: "8px 16px", background: "#667eea", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>📍 Today</button>
            <button onClick={() => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); onSelectDate(tomorrow.toISOString().slice(0, 10)); setShowHistory(false); }} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>➡️ Tomorrow</button>
            <button onClick={() => { const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7); onSelectDate(nextWeek.toISOString().slice(0, 10)); setShowHistory(false); }} style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>📅 Next Week</button>
          </div>

          <div style={{ fontWeight: 700, marginBottom: 12, color: "#2d3748", fontSize: "1.05em" }}>🔮 Upcoming Days (Next 30 Days)</div>
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {next30Days.map((date) => {
              const isSelected = date === selectedDate;
              const dateObj = new Date(date);
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
              return (
                <button key={date} onClick={() => { onSelectDate(date); setShowHistory(false); }} style={{ padding: "12px 16px", background: isSelected ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fff", color: isSelected ? "#fff" : "#2d3748", border: isSelected ? "none" : "2px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left", fontWeight: isSelected ? 700 : 500, fontSize: "0.95em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{date}</span>
                  <span style={{ fontSize: "0.85em", opacity: 0.8 }}>{dayName}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontWeight: 700, marginTop: 20, marginBottom: 12, color: "#2d3748", fontSize: "1.05em" }}>📆 Past Days (Last 30 Days)</div>
          <div style={{ display: "grid", gap: 8 }}>
            {last30Days.map((date) => {
              const isSelected = date === selectedDate;
              const isToday = date === todayStr;
              const dateObj = new Date(date);
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
              return (
                <button key={date} onClick={() => { onSelectDate(date); setShowHistory(false); }} style={{ padding: "12px 16px", background: isSelected ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fff", color: isSelected ? "#fff" : "#2d3748", border: isSelected ? "none" : "2px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left", fontWeight: isSelected ? 700 : 500, fontSize: "0.95em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{isToday ? "📍 " + date + " (Today)" : date}</span>
                  <span style={{ fontSize: "0.85em", opacity: 0.8 }}>{dayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
