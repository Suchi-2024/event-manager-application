import React, { useState } from "react";

export default function SessionSelector({ selectedDate, onSelectDate }) {
  const [showHistory, setShowHistory] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Generate last 30 days
  const getLast30Days = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const last30Days = getLast30Days();

  return (
    <div
      style={{
        background: "#f6f6fc",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        boxShadow: "0 2px 10px #ececff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <label style={{ fontWeight: "bold", fontSize: "1.1em" }}>
          Session Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          max={todayStr}
          style={{
            fontSize: "1em",
            border: "1px solid #aaa",
            borderRadius: "6px",
            padding: "7px 12px",
            background: "#fff",
          }}
          onChange={(e) => onSelectDate(e.target.value)}
        />
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: "7px 14px",
            background: "#5338ff",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95em",
          }}
        >
          📅 {showHistory ? "Hide" : "Show"} History
        </button>
        {selectedDate !== todayStr && (
          <span style={{ color: "#888", fontSize: "0.97em" }}>
            (Past session - read only)
          </span>
        )}
      </div>

      {showHistory && (
        <div
          style={{
            marginTop: 15,
            background: "#fff",
            borderRadius: 8,
            padding: 15,
            maxHeight: 250,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 10,
              color: "#333",
            }}
          >
            Last 30 Days:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {last30Days.map((date) => {
              const isSelected = date === selectedDate;
              const isToday = date === todayStr;
              return (
                <button
                  key={date}
                  onClick={() => {
                    onSelectDate(date);
                    setShowHistory(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    background: isSelected ? "#5338ff" : "#f8f8ff",
                    color: isSelected ? "#fff" : "#333",
                    border: isSelected ? "none" : "1px solid #ddd",
                    borderRadius: 6,
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: "0.95em",
                  }}
                >
                  {isToday && "📍 "}
                  {date}
                  {isToday && " (Today)"}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
