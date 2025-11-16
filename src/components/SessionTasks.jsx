import React, { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import GratitudeModal from "./GratitudeModal";
import { useAuth } from "./AuthProvider";

export default function SessionTasks({ sessionDate, onTasksChange }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [error, setError] = useState(null);

  // ⭐ NEW — AI Planner Popup
  const [plannerSuggestions, setPlannerSuggestions] = useState("");
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  const allTasksCache = useRef(null);
  const lastFetchTime = useRef(0);
  const unsubscribeRef = useRef(null);

  const dateRange = useMemo(() => {
    const startOfDay = sessionDate + "T00:00";
    const endOfDay = sessionDate + "T23:59";
    return { startOfDay, endOfDay };
  }, [sessionDate]);

  // Load tasks…
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setLoading(false);
      setError("Email verification required to access tasks.");
      return;
    }

    const now = Date.now();
    if (allTasksCache.current && now - lastFetchTime.current < 30000) {
      const filtered = allTasksCache.current.filter(
        (task) => task.due?.slice(0, 10) === sessionDate
      );
      setTasks(filtered);
      setLoading(false);
      if (onTasksChange) onTasksChange(filtered);
      return;
    }

    setLoading(true);
    if (unsubscribeRef.current) unsubscribeRef.current();

    const { startOfDay, endOfDay } = dateRange;

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("due", ">=", startOfDay),
      where("due", "<=", endOfDay),
      orderBy("due", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const t = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setTasks(t);
        lastFetchTime.current = Date.now();
        if (onTasksChange) onTasksChange(t);
        setLoading(false);
      },
      async () => {
        // fallback omitted for brevity
      }
    );

    unsubscribeRef.current = unsub;
    return () => unsub();
  }, [sessionDate, user, onTasksChange, dateRange]);

  // CRUD (unchanged)…


  // ⭐ NEW — AI Planner Function
  async function generatePlan() {
    try {
      setPlannerSuggestions("Generating plan...");
      setShowPlannerModal(true);

      const res = await fetch("/api/aiPlanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });

      const data = await res.json();
      setPlannerSuggestions(data.plan);
    } catch (e) {
      setPlannerSuggestions("⚠️ Failed to generate plan.");
    }
  }

  // Render
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = sessionDate === todayStr;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        minHeight: 210,
        padding: "20px 16px 24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <h3
        style={{
          marginBottom: 16,
          fontWeight: 700,
          fontSize: "1.3em",
          color: "#2d3748",
        }}
      >
        Tasks for {isToday ? "Today" : sessionDate}
      </h3>

      {isToday && (
        <TaskForm
          onAdd={handleAddOrEdit}
          tasks={tasks}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />
      )}

      {/* ⭐ NEW — Show AI Planner button only if ≥ 2 tasks */}
      {tasks.length >= 2 && (
        <button
          onClick={generatePlan}
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            marginBottom: 14,
            display: "block"
          }}
        >
          🔮 Generate AI Day Planner
        </button>
      )}

      {tasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#a0aec0",
            fontSize: "1.05em",
            padding: "40px 20px",
            fontStyle: "italic",
          }}
        >
          📝 No tasks for this day
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={isToday ? setEditing : undefined}
          onDelete={isToday ? handleDelete : undefined}
          onMarkOngoing={
            isToday ? (t) => markTaskStatus(t, "ongoing") : undefined
          }
          onMarkComplete={isToday ? handleMarkComplete : undefined}
        />
      )}

      {/* Gratitude Modal */}
      <GratitudeModal
        show={showGratitudeModal}
        taskText={taskToComplete?.text || ""}
        onConfirm={confirmComplete}
        onCancel={cancelComplete}
      />

      {/* ⭐ NEW — AI Planner Modal */}
      {showPlannerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <h3>🧠 AI Day Planner Suggestions</h3>
            <div
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 10,
                color: "#2d3748",
              }}
            >
              {plannerSuggestions}
            </div>

            <div style={{ textAlign: "right", marginTop: 20 }}>
              <button
                onClick={() => setShowPlannerModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "#4a5568",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
