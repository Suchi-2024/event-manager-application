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

  // ⭐ AI Planner
  const [plannerSuggestions, setPlannerSuggestions] = useState("");
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  // cache
  const allTasksCache = useRef(null);
  const lastFetchTime = useRef(0);
  const unsubscribeRef = useRef(null);

  const dateRange = useMemo(() => {
    return {
      startOfDay: sessionDate + "T00:00",
      endOfDay: sessionDate + "T23:59",
    };
  }, [sessionDate]);

  // ------------------ LOAD TASKS ------------------
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const now = Date.now();

    // quick cache
    if (allTasksCache.current && now - lastFetchTime.current < 30000) {
      const filtered = allTasksCache.current.filter(
        (t) => t.due?.slice(0, 10) === sessionDate
      );
      setTasks(filtered);
      setLoading(false);
      if (onTasksChange) onTasksChange(filtered);
      return;
    }

    setLoading(true);

    if (unsubscribeRef.current) unsubscribeRef.current();

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("due", ">=", dateRange.startOfDay),
      where("due", "<=", dateRange.endOfDay),
      orderBy("due", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setTasks(list);
        lastFetchTime.current = Date.now();
        allTasksCache.current = list;
        if (onTasksChange) onTasksChange(list);
        setLoading(false);
      },
      async (err) => {
        console.warn("⚠️ Index issue — fallback loading");
        // fallback: load all user's tasks
        const allQuery = query(collection(db, "tasks"), where("uid", "==", user.uid));
        const docs = await getDocs(allQuery);
        const all = docs.docs.map((d) => ({ ...d.data(), id: d.id }));
        allTasksCache.current = all;

        const filtered = all.filter((t) => t.due?.slice(0, 10) === sessionDate);
        setTasks(filtered);
        if (onTasksChange) onTasksChange(filtered);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsub;
    return () => unsub();
  }, [sessionDate, user]);

  // ------------------ CRUD ------------------
  async function handleAddOrEdit(task) {
    if (!user) return;

    try {
      if (editing) {
        await updateDoc(doc(db, "tasks", task.id), task);
        setEditing(null);
      } else {
        const newTask = {
          text: task.text.trim(),
          due: task.due,
          status: task.status || "pending",
          priority: task.priority || "medium",
          reminder: task.reminder || "",
          reminderSent: false,
          uid: user.uid,
          createdAt: new Date().toISOString(),
        };
        const ref = await addDoc(collection(db, "tasks"), newTask);
        setTasks((p) => [...p, { ...newTask, id: ref.id }]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(task) {
    try {
      await deleteDoc(doc(db, "tasks", task.id));
    } catch (err) {
      console.error(err);
    }
  }

  async function markTaskStatus(task, status) {
    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
    } catch (err) {
      console.error(err);
    }
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  // FIXED: close modal before update
  async function confirmComplete(gratitude) {
    const task = taskToComplete;
    setShowGratitudeModal(false);
    setTaskToComplete(null);

    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: "completed",
        gratitude,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  }

  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  // ------------------ AI PLANNER ------------------
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
      setPlannerSuggestions(data.plan || "No plan generated.");
    } catch {
      setPlannerSuggestions("⚠️ Failed to generate plan.");
    }
  }

  // ------------------ UI ------------------
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = sessionDate === todayStr;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 16px 24px",
      }}
    >
      <h3 style={{ fontWeight: 700, fontSize: "1.3em", marginBottom: 16 }}>
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

      {/* ⭐ AI button appears if 2 or more tasks exist */}
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
          }}
        >
          🔮 Generate AI Day Planner
        </button>
      )}

      {tasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            fontStyle: "italic",
            color: "#a0aec0",
          }}
        >
          📝 No tasks for this day
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={isToday ? setEditing : undefined}
          onDelete={isToday ? handleDelete : undefined}
          onMarkOngoing={isToday ? (t) => markTaskStatus(t, "ongoing") : undefined}
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

      {/* ⭐ AI PLANNER MODAL */}
      {showPlannerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              maxWidth: 520,
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <h3>🧠 AI Day Planner</h3>
            <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              {plannerSuggestions}
            </div>
            <button
              onClick={() => setShowPlannerModal(false)}
              style={{
                marginTop: 20,
                background: "#4a5568",
                color: "white",
                padding: "8px 16px",
                borderRadius: 6,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
