// src/components/Toast.jsx
import React from "react";

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed",
      right: 20,
      bottom: 28,
      zIndex: 9999,
      background: "rgba(17,24,39,0.95)",
      color: "white",
      padding: "10px 14px",
      borderRadius: 10,
      boxShadow: "0 6px 18px rgba(2,6,23,0.2)",
      fontWeight: 600,
      fontSize: "0.95em",
      pointerEvents: "none",
      transition: "transform 0.18s ease, opacity 0.18s ease"
    }}>
      {message}
    </div>
  );
}
