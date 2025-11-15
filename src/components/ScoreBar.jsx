import React from "react";

export default function ScoreBar({ score, streak }) {
  return (
    <div
      style={{
        background: "#e5eaff",
        borderRadius: 8,
        padding: "8px 18px",
        fontSize: 20,
        marginBottom: 15,
        display: "flex",
        alignItems: "center",
        gap: 20,
        justifyContent: "center",
      }}
    >
      <span>
        🌟 Score: <b>{score}</b>
      </span>
      <span>
        🔥 Streak: <b>{streak}</b>
      </span>
    </div>
  );
}
