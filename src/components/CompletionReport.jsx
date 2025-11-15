import React from "react";

export default function CompletionReport({
  show,
  tasks,
  score,
  streak,
  onClose,
}) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.32)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 13,
          maxWidth: 520,
          width: "95%",
          padding: 26,
        }}
      >
        <h2>🏅 All Tasks Complete!</h2>
        <div>
          <b>Score:</b> {score} &nbsp;|&nbsp; <b>Streak:</b> {streak}
        </div>
        <h3 style={{ marginTop: 15 }}>Your Gratitude Reflections:</h3>
        <ul>
          {tasks.map((t, i) => (
            <li key={t.id} style={{ marginBottom: 7 }}>
              <b>{t.text}</b> — <i>"{t.gratitude}"</i>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 16 }}>
          <b>Personalized suggestions (AI):</b>
          <p>
            {/* Placeholder for LLM-based insights if you integrate */}
            {
              "Keep up the positive momentum! For even more productivity, try batching similar tasks or varying your gratitude reflections."
            }
          </p>
        </div>
        <button
          style={{
            margin: "20px 0 0 0",
            padding: "7px 18px",
            borderRadius: 7,
            background: "#41d97b",
            color: "#fff",
            fontSize: 16,
            border: "none",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}
