// src/components/SessionTasks.jsx
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
  limit,
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

  const [plannerText, setPlannerText] = useState("");
  const [showPlanner, setShowPlanner] = useState(false);

  // Cache per-date
  const allTasksCache = useRef(null); // { date: '2025-11-16', tasks: [...] }
  const lastFetch = useRef(0);
  const unsubRef = useRef(null);

  // dateRange for queries (string format consistent with your tasks.due)
  const dateRange = useMemo(
    () => ({
      startOfDay: sessionDate + "T00:00",
      endOfDay: sessionDate + "T23:59",
    }),
    [sessionDate]
  );

  // robust date comparisons (remove timezone issues)
  const getDateMidnight = (isoDateStr) => {
    const d = new Date(isoDateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use cache only if it is for THIS selected date and recent
    const now = Date.now();
    if (
      allTasksCache.current &&
      allTasksCache.current.date === sessionDate &&
      now - lastFetch.current < 30000
    ) {
      setTasks(allTasksCache.current.tasks);
      setLoading(false);
      if (onTasksChange) onTasksChange(allTasksCache.current.tasks);
      return;
    }

    setLoading(true);

    // Clean previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Primary (recommended) query: use range on 'due' and orderBy('due')
    // Make sure you have an index for uid ASC + due ASC in Firestore console.
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
        const arr = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setTasks(arr);
        lastFetch.current = Date.now();
        allTasksCache.current = { date: sessionDate, tasks: arr };
        if (onTasksChange) onTasksChange(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore realtime query failed:", err);
        // Do NOT fallback to full user query — that caused duplicates & slowness.
        setTasks([]);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;
    return () => {
      if (unsub) unsub();
      unsubRef.current = null;
    };
  }, [sessionDate, user, onTasksChange, dateRange]);

  // ---------- CRUD ----------
  async function handleAddOrEdit(task) {
    if (!user) return;

    // Normalize text
    const text = (task.text || "").trim();
    if (!text) return;

    const taskDate = task.due?.slice(0, 10);
    if (!taskDate) return alert("Invalid due date");

    // Duplicate check (Option A: same text + same day blocked)
    // Fast client-side check if cache has same date
    if (allTasksCache.current && allTasksCache.current.date === taskDate) {
      const dup = allTasksCache.current.tasks.find(
        (t) => t.text?.trim() === text && t.due?.slice(0, 10) === taskDate
      );
      if (dup && (!task.id || dup.id !== task.id)) {
        return alert("Duplicate task for the same day blocked.");
      }
    } else {
      // Safe server-side check: query for same uid + text, then compare date slices
      try {
        const q = query(
          collection(db, "tasks"),
          where("uid", "==", user.uid),
          where("text", "==", text),
          limit(5)
        );
        const snap = await getDocs(q);
        const found = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .find((t) => t.due?.slice(0, 10) === taskDate && (!task.id || t.id !== task.id));
        if (found) {
          return alert("Duplicate task for the same day blocked.");
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
        // allow creation if check failed? better to warn user
        // we'll proceed (optionally you can block)
      }
    }

    if (editing) {
      // editing existing
      try {
        await updateDoc(doc(db, "tasks", task.id), {
          ...task,
          text,
        });
        setEditing(null);
      } catch (err) {
        console.error("Update failed:", err);
        alert("Failed to update task.");
      }
    } else {
      // new task
      const newTask = {
        text,
        due: task.due,
        status: task.status || "pending",
        priority: task.priority || "medium",
        reminder: task.reminder || "",
        reminderSent: false,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        // helpful derived field — optional if you already persist dueDate
        dueDate: task.due?.slice(0, 10),
      };

      try {
        await addDoc(collection(db, "tasks"), newTask);

        // if created for other date, dispatch switchDate (small delay to let realtime listener update)
        const createdDate = newTask.dueDate;
        if (createdDate && createdDate !== sessionDate) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("switchDate", { detail: createdDate }));
          }, 200);
        }
      } catch (err) {
        console.error("Add task failed:", err);
        alert("Failed to create task.");
      }
    }
  }

  async function handleDelete(task) {
    try {
      await deleteDoc(doc(db, "tasks", task.id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function markTaskStatus(task, status) {
    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
    } catch (err) {
      console.error("Mark status failed:", err);
    }
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  async function confirmComplete(gratitude) {
    const t = taskToComplete;
    setShowGratitudeModal(false);
    setTaskToComplete(null);
    if (!t) return;
    try {
      await updateDoc(doc(db, "tasks", t.id), {
        status: "completed",
        gratitude,
        completedAt: new Date().toISOString(),
      });
      // emit tasksChanged to update score/streak
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Confirm complete failed:", err);
    }
  }

  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  // ---------- AI PLANNER (unchanged) ----------
  async function generatePlan() {
    setPlannerText("⏳ Generating AI plan...");
    setShowPlanner(true);

    try {
      const res = await fetch("/api/aiPlanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });

      const data = await res.json();
      setPlannerText(data.plan || "No output.");
    } catch (err) {
      setPlannerText("⚠️ Failed to generate plan.");
    }
  }

  // UI: robust isToday/isFuture/isPast
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const selectedMid = getDateMidnight(sessionDate);

  const isToday = selectedMid.getTime() === todayMid.getTime();
  const isFuture = selectedMid.getTime() > todayMid.getTime();
  const isPast = selectedMid.getTime() < todayMid.getTime();

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 20px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(102, 126, 234, 0.1)",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 15px",
          }}
        />
        <div style={{ color: "#718096", fontSize: "1.1em" }}>Loading tasks...</div>
        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid rgba(102, 126, 234, 0.1)",
      }}
    >
      <h3 style={{ fontWeight: 700, fontSize: "1.3em", marginBottom: 16, color: "#2d3748" }}>
        Tasks for {isToday ? "Today" : sessionDate}
        {isFuture && (
          <span style={{ marginLeft: 10, fontSize: "0.7em", color: "#667eea", background: "#eff6ff", padding: "4px 10px", borderRadius: 6 }}>
            📆 Future
          </span>
        )}
        {isPast && (
          <span style={{ marginLeft: 10, fontSize: "0.7em", color: "#718096", background: "#edf2f7", padding: "4px 10px", borderRadius: 6 }}>
            📖 Past
          </span>
        )}
      </h3>

      {(isToday || isFuture) && (
        <TaskForm onAdd={handleAddOrEdit} tasks={tasks} editing={editing} onCancelEdit={() => setEditing(null)} />
      )}

      {isToday && tasks.length >= 2 && (
        <button
          onClick={generatePlan}
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            marginBottom: 20,
            border: "none",
            cursor: "pointer",
          }}
        >
          🔮 Generate AI Day Planner
        </button>
      )}

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#a0aec0", fontStyle: "italic" }}>📝 No tasks for this day</div>
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={isToday || isFuture ? setEditing : undefined}
          onDelete={isToday || isFuture ? handleDelete : undefined}
          onMarkOngoing={isToday ? (t) => markTaskStatus(t, "ongoing") : undefined}
          onMarkComplete={isToday ? handleMarkComplete : undefined}
        />
      )}

      <GratitudeModal show={showGratitudeModal} taskText={taskToComplete?.text || ""} onConfirm={confirmComplete} onCancel={cancelComplete} />

      {showPlanner && (
        <div style={{ marginTop: 25, padding: 20, borderRadius: 12, background: "#f8f9ff", border: "1px solid #dadaff", whiteSpace: "pre-wrap" }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🧠 AI Day Planner</h3>
          <div style={{ fontSize: "0.95em", color: "#2d3748" }}>{plannerText}</div>
          <button onClick={() => setShowPlanner(false)} style={{ marginTop: 15, background: "#4a5568", color: "white", padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer" }}>
            Hide Plan
          </button>
        </div>
      )}
    </div>
  );
}
