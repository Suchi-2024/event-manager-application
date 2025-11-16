import React, { useState } from "react";
import AIPlannerModal from "./AIPlannerModal";

export default function AIPlannerButton({ tasks }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    setLoading(true);

    const res = await fetch("/api/aiPlanner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });

    const data = await res.json();
    setPlan(data.plan);
    setLoading(false);
    setModalOpen(true);
  }

  return (
    <>
      <button
        onClick={generatePlan}
        style={{
          padding: "10px 20px",
          background: "#4c51bf",
          color: "white",
          borderRadius: 8,
        }}
        disabled={loading}
      >
        {loading ? "Generating..." : "✨ AI Planner Suggestion"}
      </button>

      <AIPlannerModal open={modalOpen} onClose={() => setModalOpen(false)}>
        <pre style={{ whiteSpace: "pre-wrap" }}>{plan}</pre>
      </AIPlannerModal>
    </>
  );
}
