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

  const last30Days = getLast30Days();

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "24px",
        marginBottom: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid rgba(102, 126, 234, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            fontWeight: 700,
            fontSize: "1.1em",
            color: "#2d3748",
          }}
        >
          📅 Session Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          max={todayStr}
          style={{
            fontSize: "1em",
            border: "2px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 14px",
            background: "#fff",
            fontWeight: 500,
            color: "#2d3748",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onChange={(e) => onSelectDate(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#667eea";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: "10px 18px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95em",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(102, 126, 234, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(102, 126, 234, 0.3)";
          }}
        >
          {showHistory ? "📅 Hide History" : "📅 Show History"}
        </button>
        {selectedDate !== todayStr && (
          <span
            style={{
              color: "#718096",
              fontSize: "0.95em",
              fontStyle: "italic",
              background: "#edf2f7",
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            📖 Past session - read only
          </span>
        )}
      </div>

      {showHistory && (
        <div
          style={{
            marginTop: 20,
            background: "#f7fafc",
            borderRadius: 12,
            padding: 16,
            maxHeight: 300,
            overflowY: "auto",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 12,
              color: "#2d3748",
              fontSize: "1.05em",
            }}
          >
            📆 Last 30 Days
          </div>
          <div style={{ display: "grid", gap: 8 }}>
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
                    padding: "12px 16px",
                    background: isSelected
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "#fff",
                    color: isSelected ? "#fff" : "#2d3748",
                    border: isSelected
                      ? "none"
                      : "2px solid #e2e8f0",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.95em",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#667eea";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
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
