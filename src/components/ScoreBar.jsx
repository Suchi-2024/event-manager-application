import React from "react";

export default function ScoreBar({ score, streak }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: 16,
        padding: "20px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: "clamp(16px, 4vw, 30px)",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255, 255, 255, 0.15)",
          padding: "12px 20px",
          borderRadius: 12,
          backdropFilter: "blur(10px)",
          flex: "1 1 120px",
          justifyContent: "center",
          minWidth: 120,
        }}
      >
        <span style={{ fontSize: "clamp(1.5em, 5vw, 2em)" }}>🌟</span>
        <div>
          <div
            style={{
              fontSize: "clamp(0.75em, 3vw, 0.85em)",
              color: "rgba(255, 255, 255, 0.8)",
              fontWeight: 500,
            }}
          >
            Score
          </div>
          <div
            style={{
              fontSize: "clamp(1.4em, 5vw, 1.8em)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {score}
          </div>
        </div>
      </div>

      <div
        style={{
          width: 2,
          height: 50,
          background: "rgba(255, 255, 255, 0.3)",
          display: "none",
        }}
        className="score-divider"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255, 255, 255, 0.15)",
          padding: "12px 20px",
          borderRadius: 12,
          backdropFilter: "blur(10px)",
          flex: "1 1 120px",
          justifyContent: "center",
          minWidth: 120,
        }}
      >
        <span style={{ fontSize: "clamp(1.5em, 5vw, 2em)" }}>🔥</span>
        <div>
          <div
            style={{
              fontSize: "clamp(0.75em, 3vw, 0.85em)",
              color: "rgba(255, 255, 255, 0.8)",
              fontWeight: 500,
            }}
          >
            Streak
          </div>
          <div
            style={{
              fontSize: "clamp(1.4em, 5vw, 1.8em)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {streak}
          </div>
        </div>
      </div>

      <style>
        {`
          @media (min-width: 500px) {
            .score-divider {
              display: block !important;
            }
          }
        `}
      </style>
    </div>
  );
}
